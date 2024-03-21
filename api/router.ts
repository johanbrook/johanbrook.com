import { isDebug } from './config.ts';
import { isTest } from './config.ts';
import { ProblemError } from './problem.ts';

interface Route<U = unknown> {
    pattern: URLPattern;
    handler: RequestHandler<U>;
    options: {
        method: Method;
    };
}

type RequestHandler<U> = (req: RouterRequest<U>) => Promise<Response> | Response;

type Params = Record<string, string | undefined>;

export class RouterRequest<U> extends Request {
    params: Params;
    query: URLSearchParams;
    user?: U;

    constructor(req: Request, params: Params, query: URLSearchParams) {
        super(req);
        this.params = params;
        this.query = query;
    }
}

interface Match<U> {
    params: Params;
    query: URLSearchParams;
    handler: RequestHandler<U>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'ALL';

export class Router<U = unknown> {
    private routes: Array<Route<U>> = [];

    route(method: Method, pathname: `/${string}`, handler: RequestHandler<U>) {
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
            const newReq = new RouterRequest<U>(req, match.params, match.query);
            return Router.errorHandler(match.handler)(newReq);
        }

        return new Response('Not found', { status: 404 });
    }

    private match(url: string, method: string): Match<U> | null {
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

    static errorHandler<U>(fn: RequestHandler<U>): RequestHandler<U> {
        return async (req) => {
            try {
                return await fn(req);
            } catch (err) {
                if (!isTest() || isDebug()) {
                    if (isDebug()) {
                        console.error(err);
                    }
                    if (err instanceof ProblemError) {
                        if (err.status >= 500) {
                            console.error(`Problem in ${req.url}:`, err);
                        }
                    } else {
                        console.error(`Error in ${req.url}:`, err);
                    }
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
