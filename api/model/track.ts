import { FileHost } from '../services/index.ts';
import * as Yaml from 'std/yaml/mod.ts';

export interface TrackInput {
    [k: string]: string;
    name: string;
    artist: string;
}

const FILE = 'src/_data/current_track.yml';

export const setCurrent = async (fileHost: FileHost, inp: TrackInput) => {
    await fileHost.putFile(
        Yaml.stringify(
            capitaliseMembers(inp),
        ),
        FILE,
    );
};

const capitaliseMembers = <T extends Record<string, string>>(inp: T): T => {
    const copy: any = { ...inp };

    for (const [k, v] of Object.entries(copy) as Array<[string, string]>) {
        copy[k] = capitalise(v);
    }

    return copy;
};

const capitalise = (str: string) =>
    str.split(/\s+/).map((s) => s.at(0)?.toUpperCase() + s.slice(1)).join(' ');
