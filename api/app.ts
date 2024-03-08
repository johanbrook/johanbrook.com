import { RequestHandler, Router } from './router.ts';
import { postNote } from './features/post-note.ts';
import { checkAuth } from './auth.ts';
import { isTest } from './config.ts';
import { ProblemError } from './problem.ts';
import { Connectors } from './connectors/index.ts';

export function createApp(connectors: Connectors) {
    const router = new Router();

    router.route('POST', '/post-note', errorHandler(authHandler(postNote.bind(null, connectors))));

    return router;
}

const authHandler = (fn: RequestHandler) => (req: Request) => {
    const client = checkAuth(req); // throws on error
    console.log('Client %s authed', client.id);
    return fn(req);
};

const errorHandler = (fn: RequestHandler): RequestHandler => async (req) => {
    try {
        return await fn(req);
    } catch (err) {
        if (!isTest()) {
            console.error(`Error in ${req.url}:`, err);
        }

        if (err instanceof Response) {
            return err;
        }

        return new Response((err as Error).message ?? 'Something went wrong', {
            status: err instanceof ProblemError ? err.status : 500,
        });
    }
};
