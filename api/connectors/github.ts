import { Connector } from './index.ts';
import { join } from 'path';
import { formatDate } from '../date.ts';
import { ProblemError, ProblemKind } from '../problem.ts';
import * as Yaml from 'yaml';

const API_ROOT = 'https://api.github.com';

export const createGithubConnector = (token: string, repo: string): Connector => {
    if (!token) {
        return {
            putFile: async () => {
                return 'MOCK';
            },
        };
    }

    return {
        putFile: async <M extends Record<string, unknown>>(
            date: Date,
            contents: string,
            path: string,
            fileName: string | null,
            meta: M
        ) => {
            const fileDate = formatDate(date, true);

            const content = `---
    ${Yaml.stringify(meta)}
    ---
    ${contents}\n
    `;

            path = join(path, fileName ?? `${fileDate}.md`);

            const res = await githubRequest(
                'PUT',
                `/repos/${repo}/contents/${path}`,
                {
                    message: `Automated via Johan's API`,
                    content: base64(content),
                },
                token
            );

            if (!res.content?.name || !res.content?.html_url) {
                throw new ProblemError(ProblemKind.GitHubError, 'Unexpected response when creating a note');
            }

            const { html_url } = res.content;

            return html_url;
        },
    };
};

interface Payload {
    message: string; // commit msg
    content: string; // base64'd
}

const githubRequest = async (method: string, resource: string, payload: Payload, token: string) => {
    const res = await fetch(API_ROOT + resource, {
        method,
        headers: {
            accept: 'application/vnd.github.v3+json',
            authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'user-agent': 'Johan.im-API/1.0',
        },
        body: JSON.stringify({
            ...payload,
            branch: 'main',
        }),
    });

    if (!res.ok) {
        throw new Error(
            `GitHub request failed: ${method} ${res.status} ${resource}: ${res.statusText} ${await res.text()}`
        );
    }

    const json = await res.json();

    return json;
};

// From https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
// To not mess up utf-8 chars in the string.
const base64 = (str: string) =>
    btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => String.fromCharCode(parseInt(p1, 16))));