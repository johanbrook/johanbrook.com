import { Services } from '../api/services/index.ts';
import { Spy, spy } from 'std/testing/mock.ts';
export { spy } from 'std/testing/mock.ts';

interface Mock {
    services: { [K in keyof Services]: WithSpy<Services[K]> };
}

type WithSpy<C> = { [K in keyof C]: Spy };

export const mock = (): Mock => {
    const mockFileHost = {
        putFile: spy(() => Promise.resolve('foo')),
        getFile: spy(() => Promise.resolve('foo')),
    };

    const mockSpotify = {
        lookupUrl: spy(() =>
            Promise.resolve({
                name: 'Hitchiker',
                artist: 'Neil Young',
            })
        ),
    };

    const services = {
        fileHost: mockFileHost,
        spotify: mockSpotify,
    };

    return {
        services,
    };
};
