import { Router, RouterRequest } from './router.ts';
import { checkAuth, Client } from './auth.ts';
import { Services } from './services/index.ts';
import { pipe } from './pipe.ts';
import { addBook, finishBook, getCurrentBooks, postNote } from './routes/index.ts';
import { urlForBook } from '../src/_includes/permalinks.ts';
import { setCurrentTrack, setCurrentTrackFromSpotifyUrl } from './routes/index.ts';
import { addLink } from './routes/link.ts';
import { getConfig } from './config.ts';

export function createApp(services: Services) {
    const router = new Router<Client>();

    router.route(
        'GET',
        '/check-auth',
        pipe(authHandler, (req) => {
            if (!req.user) {
                console.warn('No user on request in /check-auth! This is a bug.');
                return new Response('Bad user state', { status: 500 });
            }
            return new Response(`Authed as ${req.user.id}`);
        }),
    );

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
            const url = new URL(urlForBook(book), getConfig('ROOT_URL')).toJSON();

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
            const url = new URL(urlForBook(updatedBook), getConfig('ROOT_URL')).toJSON();

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

    router.route(
        'PUT',
        '/current-track',
        pipe(authHandler, async (req) => {
            const track = await setCurrentTrack(services, await req.json());

            return Response.json({ track });
        }),
    );

    router.route(
        'PUT',
        '/current-track/spotify',
        pipe(authHandler, async (req) => {
            const track = await setCurrentTrackFromSpotifyUrl(services, await req.json());

            return Response.json({ track });
        }),
    );

    router.route(
        'POST',
        '/add-link',
        pipe(authHandler, async (req) => {
            await addLink(services, await req.json());

            return new Response('Link added', { status: 201 });
        }),
    );

    return router;
}

const authHandler = (req: RouterRequest<Client>) => {
    const client = checkAuth(req); // throws on error
    req.user = client;
    return req;
};
