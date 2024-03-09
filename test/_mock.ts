import { FileHost, Services } from '../api/services/index.ts';
import { Spy, spy } from 'test_mock';

interface Mock {
    connectors: { [K in keyof Services]: SpyConnector<Services[K]> };
}

type SpyConnector<C extends FileHost> = { [K in keyof C]: Spy };

export const mock = (): Mock => {
    const mockGitHubConnector = {
        putFile: spy(() => Promise.resolve('foo')),
    };

    const connectors = {
        github: mockGitHubConnector,
    };

    return {
        connectors,
    };
};
