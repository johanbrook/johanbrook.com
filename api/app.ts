import { Router, RouterRequest } from './router.ts';
import { checkAuth } from './auth.ts';
import { Services } from './services/index.ts';
import { pipe } from './pipe.ts';
import { addBook, finishBook, getCurrentBook, postNote } from './routes/index.ts';
import { urlForBook } from '../src/_includes/permalinks.ts';

export function createApp(services: Services) {
    const router = new Router();

    router.route(
        'POST',
        '/post-note',
        pipe(authHandler, async (req) => {
            const url = (await postNote(services, await req.json())).toJSON();

            return Response.json({
                url,
            }, {
                status: 201,
                headers: {
                    Location: url,
                },
            });
        }),
    );

    router.route(
        'GET',
        '/current-book',
        pipe(authHandler, async () => {
            const book = await getCurrentBook(services);

            if (!book) return new Response('No current book', { status: 404 });

            return Response.json(book, { status: 200 });
        }),
    );

    router.route(
        'POST',
        '/add-book',
        pipe(authHandler, async (req) => {
            const book = await addBook(services, await req.json());
            const url = new URL(urlForBook(book), self.location.href).toJSON();

            return Response.json({
                book: book,
                url,
            }, {
                status: 201,
                headers: {
                    Location: url,
                },
            });
        }),
    );

    router.route(
        'PUT',
        '/finish-book/:slug',
        pipe(authHandler, async (req) => {
            const updatedBook = await finishBook(services, req.params.slug!, await req.json());

            return new Response(`Finished "${updatedBook.title}"`, {
                status: 200,
            });
        }),
    );

    return router;
}

const authHandler = (req: RouterRequest) => {
    checkAuth(req); // throws on error
    return req;
};
