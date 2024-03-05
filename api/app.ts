import { Router } from './router.ts';
import { postNote } from './features/post-note.ts';
import { checkAuth } from './auth.ts';

const router = new Router();

type RequestHandler = (req: Request) => Promise<Response>;

interface App {
    handleRequest: RequestHandler;
}

export function mkApp(): App {
    router.route('POST', '/post-note', postNote);

    return { handleRequest: (req) => handleRequest(req).catch(errorHandler) };
}

async function handleRequest(req: Request) {
    const client = checkAuth(req);

    console.log('Client authed: %s', client.id);

    return await router.run(req);
}

function errorHandler(err: unknown) {
    if (err instanceof Response) {
        return err;
    }

    return new Response((err as Error).message ?? 'Something went wrong', {
        status: (err as any).status || 500,
    });
}
