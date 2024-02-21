import { Router } from './router.ts';
import { postNote } from './features/post-note.ts';

const router = new Router();

router.route('POST', '/post-note', postNote);

Deno.serve(
    {
        onListen: ({ port, hostname }) => {
            console.log(`👻 Johan's API server listening on http://${hostname}:${port}`);
        },
    },
    async (req) => {
        const log = (status: number) => {
            const color = status < 200 || 400 <= status ? 'color:red' : 'color:green';
            console.log(`%c${status}`, color, `${req.method} ${req.url}`);
        };

        const match = router.match(req.url, req.method);
        const res = match
            ? await match.handler(req)
            : new Response(`No routes for ${req.method} ${req.url}`, { status: 404 });

        log(res.status);

        return res;
    }
);
