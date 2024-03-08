import { RequestHandler, Router } from './router.ts';
import { postNote } from './features/post-note.ts';
import { checkAuth } from './auth.ts';
import { Connectors } from './connectors/index.ts';

export function createApp(connectors: Connectors) {
    const router = new Router();

    router.route('POST', '/post-note', authHandler(postNote.bind(null, connectors)));

    return router;
}

const authHandler = (fn: RequestHandler) => (req: Request) => {
    const client = checkAuth(req); // throws on error
    console.log('Client %s authed', client.id);
    return fn(req);
};
