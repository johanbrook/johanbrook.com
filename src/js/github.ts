import { Endpoints } from '../../deps.ts';
import { config, isLocal } from './config.ts';
import type { Service } from './service.ts';
import { type Err, isErr } from './util.ts';

const STORAGE_KEY = 'jb_tok';

const API_ROOT = 'https://api.github.com';

export interface Args {
    url: string;
}

export const mkGitHub = ({ url }: Args): Service => {
    const doAuth = () => {
        location.href = url;
    };

    const request = async <T, B = Record<never, never>>(
        resource: `/${string}`,
        {
            method = 'GET',
            query,
            body,
        }: {
            method?: 'GET' | 'POST' | 'PUT';
            query?: Record<string, string>;
            body?: B;
        } = {}
    ): Promise<T | Err> => {
        const storedTok = getStoredToken();

        if (!storedTok) {
            doAuth();
            return Promise.resolve({} as T);
        }

        const qs: string = query
            ? '?' + new URLSearchParams(query).toString()
            : '';

        const res = await fetch(API_ROOT + resource + qs, {
            method,
            headers: {
                accept: 'application/vnd.github.v3+json',
                authorization: `token ${storedTok}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const json = await res.json();

        if (!res.ok) {
            if (res.status == 401) {
                doAuth();
                return Promise.resolve({} as T);
            }

            return {
                kind: 'err',
                msg: 'Failed to request GitHub REST data',
                cause: new Error(
                    `${method} ${res.status} ${resource}: ${
                        json.message || res.statusText
                    }`
                ),
            };
        }

        return json;
    };

    type AuthError = { error: string };
    type AuthSuccess = { token: string };

    const isAuthError = (err: Record<string, unknown>): err is AuthError =>
        !!(err as AuthError).error;

    const fetchToken: Service['fetchToken'] = async (code) => {
        // remove ?code=... from URL
        const path =
            location.pathname +
            location.search.replace(/\bcode=\w+/, '').replace(/\?$/, '');
        history.pushState({}, '', path);

        const res = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!res.ok) {
            return {
                kind: 'err',
                msg: res.statusText,
            };
        }

        const result: AuthSuccess | AuthError = await res.json();

        if (isAuthError(result)) {
            return {
                kind: 'err',
                msg: result.error,
            };
        }

        try {
            localStorage.setItem(STORAGE_KEY, result.token);
        } catch (_ex) {
            //
        }

        return {
            kind: 'token',
            tok: result.token,
        };
    };

    const createNote: Service['createNote'] = async (text) => {
        type Endpoint = Endpoints['PUT /repos/{owner}/{repo}/contents/{path}'];

        const d = new Date();
        const { repo, owner, notesDir } = config;
        const branch = isLocal() ? 'dev' : 'main';
        const date = formatDate(d);
        const fileDate = formatDate(d, true);

        const content = `---
date: ${date}
location: On the run
---

${text}\n
`;

        const fileName = `${fileDate}.md`;
        const path = notesDir + '/' + fileName;

        const res = await request<
            Endpoint['response']['data'],
            Omit<Endpoint['parameters'], 'path' | 'repo' | 'owner'>
        >(`/repos/${owner}/${repo}/contents/${path}`, {
            method: 'PUT',
            body: {
                message: 'Add note from GUI app',
                content: base64(content),
                branch,
            },
        });

        if (isErr(res)) return res;

        if (
            !res.content?.name ||
            !res.content?.html_url ||
            !res.commit.html_url
        )
            return {
                kind: 'err',
                msg: 'Unexpected response when creating a note',
            };

        return {
            commitUrl: res.commit.html_url,
            file: res.content.name,
            fileUrl: res.content.html_url,
        };
    };

    const maybeLogin: Service['maybeLogin'] = () => {
        const storedTok = getStoredToken();

        if (!storedTok) {
            location.href = url;
        }
    };

    return {
        maybeLogin,
        fetchToken,
        createNote,
    };
};

const getStoredToken = (): string | null => {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch (_ex) {
        return null;
    }
};

// From https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
// To not mess up utf-8 chars in the string.
const base64 = (str: string) =>
    btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
            String.fromCharCode(parseInt(p1, 16))
        )
    );

// => 'yyyy-MM-dd HH:mm:ss'
// fileName: true => 'yyyy-MM-dd-HH-mm'
const formatDate = (date: Date, fileName = false): string => {
    const datePart = [
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
    ]
        .map((n) => String(n).padStart(2, '0'))
        .join('-');

    const timePart = [
        date.getUTCHours(),
        date.getUTCMinutes(),
        fileName ? null : date.getUTCSeconds(),
    ]
        .filter(Boolean)
        .map((n) => String(n).padStart(2, '0'))
        .join(fileName ? '-' : ':');

    if (fileName) {
        return datePart + '-' + timePart;
    }

    return datePart + ' ' + timePart;
};
