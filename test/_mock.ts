import { Connectors, Connector } from '../api/connectors/index.ts';
import { spy, Spy } from 'test_mock';

interface Mock {
    connectors: { [K in keyof Connectors]: SpyConnector<Connectors[K]> };
}

type SpyConnector<C extends Connector> = { [K in keyof C]: Spy };

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
