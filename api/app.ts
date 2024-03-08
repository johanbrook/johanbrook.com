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
    checkAuth(req); // throws on error
    return fn(req);
};
