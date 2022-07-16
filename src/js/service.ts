import type { Err, Result } from './util.ts';

/** An access token used for authenticating API requests. */
export interface Token {
    kind: 'token';
    tok: string;
}

export interface Repo {
    name: string;
    url: string;
}

export interface CreateNoteResult {
    file: string;
    fileUrl: string;
    commitUrl: string;
}

export interface Service {
    maybeLogin: () => void;
    fetchToken: (code: string) => Promise<Token | Err>;
    createNote: (text: string, draft: boolean) => Promise<Result<CreateNoteResult>>;
}
