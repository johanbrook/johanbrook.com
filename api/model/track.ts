import { FileHost } from '../services/index.ts';
import { yamlStringify } from '../yaml.ts';

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
        yamlStringify({
            name: capitalise(clean(name)),
            artist: capitalise(clean(artist)),
            ...rest,
        }),
        FILE,
    );
};

const capitalise = (str: string) => str.split(/\s+/).map((s) => s.at(0)?.toUpperCase() + s.slice(1)).join(' ');

// Remove annoying suffixes like "<track> - Remaster".
const clean = (str: string) => {
    const idx = str.search(/[-\(]/g);
    return (idx != -1 ? str.slice(0, idx) : str).trim();
};
