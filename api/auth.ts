import { safeEqualStrings } from './crypto.ts';
import { ProblemKind } from './problem.ts';
import { ProblemError } from './problem.ts';

export interface Client {
    id: string; // unique
    token: string;
}

const IOS = {
    id: 'ios-shortcut',
    token: 'aaa',
};

const MAC = {
    id: 'mac-shortcut',
    token: 'bbb',
};

const CLIENTS: Record<string, Client> = {
    'ios-shortcut': IOS,
    'mac-shortcut': MAC,
};

export const checkAuth = (req: Request): Client => {
    const clientId = new URL(req.url).searchParams.get('clientId');
    const token = req.headers.get('authorization');

    if (!clientId || !token) {
        throw new ProblemError(ProblemKind.BadInput, 'Missing important credentials');
    }

    const client = CLIENTS[clientId];

    if (!client) {
        throw new ProblemError(ProblemKind.BadInput, 'Bad client');
    }

    if (!safeEqualStrings(`API-Token ${client.token}`, token)) {
        throw new ProblemError(ProblemKind.BadAuth, 'Bad auth token');
    }

    return client;
};
