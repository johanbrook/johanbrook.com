import { Router } from './router.ts';
import { postNote } from './features/post-note.ts';
import { checkAuth } from './auth.ts';
import { Connectors } from './connectors/index.ts';
import { pipe } from './pipe.ts';

export function createApp(connectors: Connectors) {
    const router = new Router();

    router.route(
        'POST',
        '/post-note',
        pipe(authHandler, async (req) => {
            await postNote(connectors, await req.json());

            return new Response('Note posted', { status: 200 });
        }),
    );

    return router;
}

const authHandler = (req: Request) => {
    checkAuth(req); // throws on error
    return req;
};
