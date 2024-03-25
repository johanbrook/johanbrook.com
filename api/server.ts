// deno run --allow-env --allow-net --allow-read --allow-write --location https://johan.im api/server.ts
import { createApp } from './app.ts';
import { createServices } from './services/index.ts';
import 'temporal-polyfill/global';

const app = createApp(createServices());

Deno.serve(
    {
        onListen: ({ port, hostname }) => {
            console.log(`👻 Johan's API server listening on http://${hostname}:${port}`);
        },
    },
    async (req, { remoteAddr }) => {
        const res = await app.run(req);
        log(req, res, remoteAddr.hostname);
        return res;
    },
);

const log = (req: Request, res: Response, ip: string) => {
    const color = res.status < 200 || 400 <= res.status ? 'color:red' : 'color:green';
    console.log(`%c${res.status}`, color, `${req.method} ${req.url} ${ip}`);

    return res;
};
