import { isTest } from './config.ts';

interface Route {
    pattern: URLPattern;
    handler: RequestHandler;
    options: {
        method: Method;
    };
}

type RequestHandler = (req: Request) => Promise<Response> | Response;

interface Match {
    params: Record<string, string | undefined>;
    query: URLSearchParams;
    handler: RequestHandler;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'ALL';

export class Router {
    private routes: Array<Route> = [];

    route(method: Method, pathname: string, handler: RequestHandler) {
        this.routes.push({
            handler,
            pattern: new URLPattern({ pathname }),
            options: {
                method,
            },
        });
    }

    run(req: Request) {
        const match = this.match(req.url, req.method);

        if (match) {
            return Router.errorHandler(match.handler)(req);
        }

        return new Response('Not found', { status: 404 });
    }

    private match(url: string, method: string): Match | null {
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

    static errorHandler(fn: RequestHandler): RequestHandler {
        return async (req) => {
            try {
                return await fn(req);
            } catch (err) {
                if (!isTest()) {
                    console.error(`Error in ${req.url}:`, err);
                }

                if (err instanceof Response) {
                    return err;
                }

                return new Response((err as Error).message ?? 'Something went wrong', {
                    status: 'status' in err ? err.status : 500,
                });
            }
        };
    }
}
