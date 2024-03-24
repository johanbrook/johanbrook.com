import { Spotify } from './spotify.ts';

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
}
