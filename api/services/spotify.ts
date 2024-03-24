import { isTest } from '../config.ts';
import { ProblemError, ProblemKind } from '../problem.ts';

interface SpotifyTrack {
    name: string;
    artist: string;
}

export interface Spotify {
    lookupUrl: (uri: string) => Promise<SpotifyTrack>;
}

export const createSpotify = (clientId: string, clientSecret: string): Spotify => {
    if (!clientId || !clientSecret) {
        if (!isTest()) console.log('Using Spotify mock');

        return {
            lookupUrl: () => Promise.resolve({ name: 'Gimme Danger', artist: 'The Stooges' }),
        };
    }

    const lookupUrl = async (url: string) => {
        // Just request a new access token each time
        const token = await fetchAccessToken();
        const trackId = new URL(url).pathname.split('/').at(-1);

        if (!trackId) {
            throw new ProblemError(ProblemKind.BadInput, `Couldn't parse Spotify URL: ${url}`);
        }

        const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new ProblemError(ProblemKind.GitHubError, `Bad response from Spotify: ${res.status}`);
        }

        const track = await res.json();
        console.log(track);

        return <SpotifyTrack> {
            artist: track.artists.at(0).name,
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
        lookupUrl,
    };
};
