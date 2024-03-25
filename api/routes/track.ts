import { Services } from '../services/index.ts';
import * as Track from '../model/track.ts';
import { ProblemError, ProblemKind } from '../problem.ts';

export const setCurrentTrack = async (services: Services, json: any): Promise<Track.Track> => {
    const { currentTime } = services;
    const track = inputOf(json, currentTime());
    await Track.setCurrent(services.fileHost, track);

    return track;
};

export const setCurrentTrackFromSpotifyUrl = async (services: Services, json: any): Promise<Track.Track> => {
    const { spotify, currentTime } = services;
    const { url: url_ } = json;

    if (typeof url_ != 'string') {
        throw new ProblemError(ProblemKind.BadInput, `"url" must be a string`);
    }

    if (!URL.canParse(url_)) {
        throw new ProblemError(ProblemKind.BadInput, `"url" must be a valid URL`);
    }

    console.debug('spotify lookupUrl %s', url_);

    const url = new URL(url_);

    if (!url.pathname.startsWith('/track')) {
        throw new ProblemError(ProblemKind.BadInput, `Spotify URL has to be a /track URL: ${url}`);
    }

    const trackId = url.pathname.split('/').at(-1);

    if (!trackId) {
        throw new ProblemError(ProblemKind.BadInput, `Couldn't parse Spotify trackId from URL: ${url}`);
    }

    const { name, artist } = await spotify.lookupTrackId(trackId);

    const track: Track.Track = {
        name,
        artist,
        updatedAt: currentTime(),
    };

    await Track.setCurrent(services.fileHost, track);

    return track;
};

const inputOf = (json: any, now: Date): Track.TrackInput => {
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
        updatedAt: now,
    };
};
