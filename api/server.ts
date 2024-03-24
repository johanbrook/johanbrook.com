// deno run --unstable-temporal --allow-env --allow-net --allow-read --allow-write --location https://johan.im api/server.ts
import { createApp } from './app.ts';
import { createGithub } from './services/github.ts';
import { getConfig } from './config.ts';
import { Services } from './services/index.ts';
import { createLocal } from './services/local.ts';
import { createSpotify } from './services/spotify.ts';

const services: Services = {
    fileHost: getConfig('GITHUB_TOKEN', '')
        ? createGithub(getConfig('GITHUB_TOKEN'), 'johanbrook/johanbrook.com')
        : createLocal(),

    spotify: createSpotify(getConfig('SPOTIFY_CLIENT_ID', ''), getConfig('SPOTIFY_CLIENT_SECRET', '')),
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
