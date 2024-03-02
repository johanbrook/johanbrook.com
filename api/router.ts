interface Route {
    pattern: URLPattern;
    handler: Handler;
    options: {
        method: Method;
    };
}

export type Handler = (req: Request) => Promise<Response> | Response;

interface Match {
    params: Record<string, string | undefined>;
    query: URLSearchParams;
    handler: Handler;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'ALL';

export class Router {
    private routes: Array<Route> = [];

    route(method: Method, pathname: string, handler: Handler) {
        this.routes.push({
            handler,
            pattern: new URLPattern({ pathname }),
            options: {
                method,
            },
        });
    }

    match(url: string, method: string): Match | null {
        for (const route of this.routes) {
            const { pattern, handler, options } = route;
            if (options.method != method) continue; // No match

            const match = pattern.exec(url);

            if (match) {
                return {
                    handler,
                    params: match.pathname.groups,
                    query: new URLSearchParams(match.search.input),
                };
            }
        }

        return null;
    }
}
