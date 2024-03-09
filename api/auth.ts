import { ProblemKind } from './problem.ts';
import { ProblemError } from './problem.ts';

export interface Client {
    id: string; // unique
    token: string; // unique
}

const IOS = {
    id: 'ios-shortcut',
    token: 'aaa',
};

const MAC = {
    id: 'mac-shortcut',
    token: 'bbb',
};

type Token = string;

const CLIENTS: Record<Token, Client> = {
    'aaa': IOS,
    'bbb': MAC,
};

export const checkAuth = (req: Request): Client => {
    const token = req.headers.get('authorization');

    if (!token) {
        throw new ProblemError(ProblemKind.BadInput, 'Missing important credentials');
    }

    const client = CLIENTS[token.replace('API-Token', '').trim()];

    if (!client) {
        throw new ProblemError(ProblemKind.BadAuth, 'Bad auth token');
    }

    return client;
};
