import { isTest } from '../config.ts';
import { ProblemError, ProblemKind } from '../problem.ts';

interface SpotifyTrack {
    name: string;
    artist: string;
}

export interface Spotify {
    lookupTrackId: (uri: string) => Promise<SpotifyTrack>;
}

export const createSpotify = (clientId: string, clientSecret: string): Spotify => {
    if (!clientId || !clientSecret) {
        if (!isTest()) console.log('Using Spotify mock');

        return {
            lookupTrackId: () => Promise.resolve({ name: 'Gimme Danger', artist: 'The Stooges' }),
        };
    }

    const lookupTrackId = async (trackId: string) => {
        // Just request a new access token each time
        const token = await fetchAccessToken();

        console.debug('spotify API call for trackId: %s', trackId);

        const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new ProblemError(ProblemKind.SpotifyError, `Bad response: ${res.status} ${res.statusText}`);
        }

        const track = await res.json();

        console.debug('spotify lookupUrl got track: %s', track.name);

        return <SpotifyTrack> {
            artist: track.artists.map((a: any) => a.name).join(', '),
            name: track.name,
        };
    };

    const fetchAccessToken = () =>
        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        }).then((res) => res.json()).then((json) => json.access_token);

    return {
        lookupTrackId,
    };
};
