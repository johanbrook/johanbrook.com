import { getConfig } from '../config.ts';
import { createSpotify, Spotify } from './spotify.ts';
import { createGithub } from './github.ts';
import { createLocal } from './local.ts';

/** Describes the services where content is hosted. */
export interface FileHost {
    putFile(
        contents: string,
        filePath: string,
    ): Promise<string>;

    getFile(filePath: string): Promise<string | null>;
}

export interface Services {
    fileHost: FileHost;
    spotify: Spotify;
    currentTime: () => Date;
}

export const createServices = (): Services => {
    return {
        fileHost: getConfig('GITHUB_TOKEN', '')
            ? createGithub(getConfig('GITHUB_TOKEN'), 'johanbrook/johanbrook.com')
            : createLocal(),

        spotify: createSpotify(getConfig('SPOTIFY_CLIENT_ID', ''), getConfig('SPOTIFY_CLIENT_SECRET', '')),

        currentTime: () => new Date(),
    };
};
