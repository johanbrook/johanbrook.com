import { Services } from '../services/index.ts';
import * as Track from '../model/track.ts';
import { ProblemError, ProblemKind } from '../problem.ts';

export const setCurrentTrack = async (services: Services, json: any) => {
    const track = inputOf(json);
    await Track.setCurrent(services.fileHost, track);
};

export const setCurrentTrackFromSpotifyUrl = async (services: Services, json: any) => {
    const { spotify } = services;
    const { url } = json;

    if (typeof url != 'string') {
        throw new ProblemError(ProblemKind.BadInput, `"url" must be a string`);
    }

    if (!URL.canParse(url)) {
        throw new ProblemError(ProblemKind.BadInput, `"url" must be a valid URL`);
    }

    const track = await spotify.lookupUrl(url);

    await Track.setCurrent(services.fileHost, {
        name: track.name,
        artist: track.artist,
    });
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
