import { FileHost } from '../services/index.ts';
import * as Yaml from 'std/yaml/mod.ts';

export interface Track {
    [k: string]: string | Date;
    name: string;
    artist: string;
    updatedAt: Date;
}

export type TrackInput = Pick<Track, 'name' | 'artist' | 'updatedAt'>;

const FILE = 'src/_data/current_track.yml';

export const setCurrent = async (fileHost: FileHost, inp: TrackInput) => {
    const { artist, name, ...rest } = inp;
    await fileHost.putFile(
        Yaml.stringify({
            name: capitalise(name),
            artist: capitalise(artist),
            ...rest,
        }),
        FILE,
    );
};

const capitalise = (str: string) => str.split(/\s+/).map((s) => s.at(0)?.toUpperCase() + s.slice(1)).join(' ');
