import { Services } from '../api/services/index.ts';
import { Spy, spy } from 'test_mock';

interface Mock {
    services: { [K in keyof Services]: WithSpy<Services[K]> };
}

type WithSpy<C> = { [K in keyof C]: Spy };

export const mock = (): Mock => {
    const mockFileHost = {
        putFile: spy(() => Promise.resolve('foo')),
    };

    const services = {
        github: mockFileHost,
    };

    return {
        services,
    };
};
