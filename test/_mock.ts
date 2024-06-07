import { FileHost } from '../api/services/index.ts';
import { Spotify } from '../api/services/spotify.ts';
import { Spy, spy } from 'std/testing/mock.ts';
export { spy } from 'std/testing/mock.ts';

interface Mock {
    services: {
        fileHost: WithSpy<FileHost>;
        spotify: WithSpy<Spotify>;
        currentTime: () => Date;
    };
}

type WithSpy<C> = { [K in keyof C]: Spy };

interface MockInput {
    currentTime?: Date;
}

export const mock = (inp?: MockInput): Mock => {
    const { currentTime = new Date() } = inp || {};

    const mockFileHost = {
        putFile: spy(() => Promise.resolve('foo')),
        getFile: spy(() => Promise.resolve('foo')),
    };

    const mockSpotify = {
        lookupTrackId: spy(() =>
            Promise.resolve({
                name: 'Hitchiker (2018 Remaster)',
                artist: 'Neil Young',
            })
        ),
    };

    const services = {
        fileHost: mockFileHost,
        spotify: mockSpotify,
        currentTime: () => currentTime,
    };

    return {
        services,
    };
};
