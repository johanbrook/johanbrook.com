import { FileHost } from './index.ts';
import { ProblemError, ProblemKind } from '../problem.ts';
import { decodeBase64, encodeBase64 } from 'std/encoding/base64.ts';
import { isTest } from '../config.ts';

const API_ROOT = 'https://api.github.com';

export const createGithub = (token: string, repo: string): FileHost => {
    const textdecoder = new TextDecoder();

    if (!isTest()) console.log(`Using GitHub file host for repo: ${repo}`);

    return {
        putFile: async (
            contents,
            filePath,
        ) => {
            const res = await githubRequest(
                'PUT',
                `/repos/${repo}/contents/${filePath}`,
                {
                    kind: 'put',
                    body: {
                        message: `Automated via Johan's API`,
                        content: encodeBase64(contents),
                    },
                },
                token,
            );

            if (!res.content?.name || !res.content?.html_url) {
                throw new ProblemError(
                    ProblemKind.GitHubError,
                    'Unexpected response when creating a note',
                );
            }

            const { html_url } = res.content;

            return html_url;
        },

        getFile: async (filePath) => {
            const res = await githubRequest(
                'GET',
                `/repos/${repo}/contents/${filePath}`,
                null,
                token,
            );

            if (res.type != 'file') {
                throw new ProblemError(
                    ProblemKind.BadInput,
                    `Can only handle type: file from GitHub, got: ${res.type}`,
                );
            }

            return textdecoder.decode(decodeBase64(res.content));
        },
    };
};

interface PutPayload {
    kind: 'put';
    body: {
        message: string; // commit msg
        content: string; // base64'd
    };
}

type GetPayload = null;

type GitHubPayload = PutPayload | GetPayload;

async function githubRequest(
    method: 'PUT',
    resource: string,
    payload: PutPayload,
    token: string,
): Promise<any>;

async function githubRequest(
    method: 'GET',
    resource: string,
    payload: GetPayload,
    token: string,
): Promise<any>;

async function githubRequest(
    method: string,
    resource: string,
    payload: GitHubPayload,
    token: string,
): Promise<any> {
    const body = payload
        ? JSON.stringify({
            ...payload.body || {},
            branch: 'main',
        })
        : null;

    const res = await fetch(API_ROOT + resource, {
        method,
        headers: {
            accept: 'application/vnd.github+json',
            authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'user-agent': 'Johan.im-API/1.0',
        },
        body,
    });

    const json = await res.json();

    if (!res.ok) {
        throw new ProblemError(
            ProblemKind.GitHubError,
            `GitHub request failed: ${method} ${res.status} ${resource}: ${res.statusText} ${json.message}`,
        );
    }

    return json;
}
