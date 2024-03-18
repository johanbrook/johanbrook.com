import { getConfig } from './config.ts';
import { ProblemError, ProblemKind } from './problem.ts';

export interface Client {
    id: string; // unique
    name: string;
    token: string; // unique
}

const IOS: Client = {
    id: 'ios-shortcut',
    name: 'iOS Shortcut',
    token: getConfig('IOS_SHORTCUT_TOKEN'),
};

const MAC: Client = {
    id: 'mac-shortcut',
    name: 'Mac Shortcut',
    token: getConfig('MAC_SHORTCUT_TOKEN'),
};

type Token = string;

const CLIENTS: Record<Token, Client> = {
    // 🙃
    [IOS.token]: IOS,
    [MAC.token]: MAC,
};

export const checkAuth = (req: Request): Client => {
    const token = req.headers.get('authorization');

    if (!token) {
        throw new ProblemError(ProblemKind.BadInput, 'Missing important credentials');
    }

    if (!token.startsWith('API-Token')) {
        throw new ProblemError(ProblemKind.BadInput, 'Malformed auth token');
    }

    const client = CLIENTS[token.replace('API-Token', '').trim()];

    if (!client) {
        throw new ProblemError(ProblemKind.BadAuth, 'Bad auth token');
    }

    return client;
};
