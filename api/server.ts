import { mkApp } from './app.ts';

const app = mkApp();

Deno.serve(
    {
        onListen: ({ port, hostname }) => {
            console.log(`👻 Johan's API server listening on http://${hostname}:${port}`);
        },
    },
    log(app.handleRequest)
);

function log<T extends Request>(fn: (req: T) => Promise<Response>) {
    return async (req: T) => {
        const res = await fn(req);

        const color = res.status < 200 || 400 <= res.status ? 'color:red' : 'color:green';
        console.log(`%c${res.status}`, color, `${req.method} ${req.url}`);

        return res;
    };
}
