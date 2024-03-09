// deno run --unstable-temporal --allow-env --allow-net --location https://johan.im api/server.ts
import { createApp } from './app.ts';
import { createGithub } from './services/github.ts';
import { getConfig } from './config.ts';
import { Services } from './services/index.ts';

const services: Services = {
    github: createGithub(getConfig('GITHUB_TOKEN', ''), 'johanbrook/johanbrook.com'),
};

const app = createApp(services);

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
