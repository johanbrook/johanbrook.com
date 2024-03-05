import { safeEqualStrings } from './crypto.ts';

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
        throw new Response('Missing important credentials', {
            status: 400,
        });
    }

    const client = CLIENTS[clientId];

    if (!client) {
        throw new Response('Bad client', {
            status: 400,
        });
    }

    if (!safeEqualStrings(`API-Token ${client.token}`, token)) {
        throw new Response('Bad auth token', {
            status: 401,
        });
    }

    return client;
};
