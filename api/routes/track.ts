import { Services } from '../services/index.ts';
import * as Track from '../model/track.ts';
import { ProblemError, ProblemKind } from '../problem.ts';

export const setCurrentTrack = async (services: Services, json: any) => {
    const track = inputOf(json);
    await Track.setCurrent(services.fileHost, track);
};

const inputOf = (json: any): Track.TrackInput => {
    const { name, artist } = json;

    if (typeof name != 'string') {
        throw new ProblemError(ProblemKind.BadInput, `Track name must be a string`);
    }

    if (typeof artist != 'string') {
        throw new ProblemError(ProblemKind.BadInput, `Track artist must be a string`);
    }

    return {
        name: name.trim(),
        artist: artist.trim(),
    };
};
