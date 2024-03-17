import { Router, RouterRequest } from './router.ts';
import { checkAuth } from './auth.ts';
import { Services } from './services/index.ts';
import { pipe } from './pipe.ts';
import { addBook, finishBook, getCurrentBooks, postNote } from './routes/index.ts';
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
        '/current-books',
        pipe(authHandler, async () => {
            const books = await getCurrentBooks(services);

            return Response.json({ books }, { status: 200 });
        }),
    );

    router.route(
        'POST',
        '/add-book',
        pipe(authHandler, async (req) => {
            const [book] = await addBook(services, await req.json());
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
            const url = new URL(urlForBook(updatedBook), self.location.href).toJSON();

            return Response.json({
                book: updatedBook,
                url,
            }, {
                status: 200,
                headers: {
                    Location: url,
                },
            });
        }),
    );

    return router;
}

const authHandler = (req: RouterRequest) => {
    checkAuth(req); // throws on error
    return req;
};
