import { assertEquals } from 'std/assert/mod.ts';
import { assertSpyCall, assertSpyCalls } from 'std/testing/mock.ts';
import { createApp } from '../api/app.ts';
import { mock, spy } from './_mock.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { assertMatch } from 'std/assert/assert_match.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API /finish-book ok', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [{
                title: 'American Psycho',
                slug: 'america-psycho',
                author: 'Bret Easton Ellis',
                finished: true,
            }, {
                title: 'The Shards',
                slug: 'the-shards',
                author: 'Bret Easton Ellis',
            }],
        ))
    );

    const router = createApp(services);

    const now = Temporal.ZonedDateTime.from('2024-02-01T10:00:00[Asia/Bangkok]');

    const res = await router.run(
        new Request(new URL('/finish-book/the-shards', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                finishedAt: now,
                location: 'Koh Lanta, Thailand',
            }),
        }),
    );

    assertEquals(res.status, 200);

    const body = await res.json();

    assertEquals(body, {
        book: {
            'title': 'The Shards',
            'slug': 'the-shards',
            'author': 'Bret Easton Ellis',
            'finished': true,
            'finishedAt': '2024-02-01',
            'location': 'Koh Lanta, Thailand',
        },
        url: 'https://johan.im/reading/the-shards/',
    });

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            Yaml.stringify(
                // @ts-ignore-next
                [{
                    title: 'American Psycho',
                    slug: 'america-psycho',
                    author: 'Bret Easton Ellis',
                    finished: true,
                }, {
                    title: 'The Shards',
                    slug: 'the-shards',
                    author: 'Bret Easton Ellis',
                    finished: true,
                    finishedAt: '2024-02-01',
                    location: 'Koh Lanta, Thailand',
                }],
            ),
            'src/_data/books.yml',
        ],
    });
});

Deno.test('API /finish-book with bad slug', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [{
                title: 'American Psycho',
                slug: 'america-psycho',
                author: 'Bret Easton Ellis',
                finished: true,
            }, {
                title: 'The Shards',
                slug: 'the-shards',
                author: 'Bret Easton Ellis',
            }],
        ))
    );

    const router = createApp(services);

    const now = Temporal.Now.zonedDateTimeISO();

    const res = await router.run(
        new Request(new URL('/finish-book/non-existing-book', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                finishedAt: now,
                location: 'Koh Lanta, Thailand',
            }),
        }),
    );

    assertEquals(res.status, 404);

    const body = await res.text();

    assertMatch(body, /No book with slug/);

    assertSpyCalls(services.fileHost.putFile, 0);
});

Deno.test('API /current-books ok', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [{
                title: 'American Psycho',
                slug: 'america-psycho',
                author: 'Bret Easton Ellis',
            }, {
                title: 'American Psycho 2',
                slug: 'america-psycho-2',
                author: 'Bret Easton Ellis',
            }, {
                title: 'Min Kamp 1',
                slug: 'min-kamp-1',
                author: 'Karl Ove Knausgård',
                dropped: true,
            }, {
                title: 'Min Kamp 2',
                slug: 'min-kamp-2',
                author: 'Karl Ove Knausgård',
                paused: true,
            }, {
                title: 'The Shards',
                slug: 'the-shards',
                author: 'Bret Easton Ellis',
                finished: true,
            }],
        ))
    );

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/current-books', BASE_URL), {
            method: 'GET',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
        }),
    );

    assertEquals(res.status, 200);

    const body = await res.json();

    assertEquals(body, {
        books: [{
            title: 'American Psycho',
            slug: 'america-psycho',
            author: 'Bret Easton Ellis',
        }, {
            title: 'American Psycho 2',
            slug: 'america-psycho-2',
            author: 'Bret Easton Ellis',
        }],
    });
});

Deno.test('API /add-book ok', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [{
                title: 'American Psycho',
                slug: 'america-psycho',
                author: 'Bret Easton Ellis',
            }, {
                title: 'The Shards',
                slug: 'the-shards',
                author: 'Bret Easton Ellis',
                finished: true,
            }],
        ))
    );

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/add-book', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                title: 'A new book',
                author: 'Johan the Brook',
            }),
        }),
    );

    assertEquals(res.status, 201);
    assertEquals(res.headers.get('Location'), 'https://johan.im/reading/a-new-book/');

    const body = await res.json();

    assertEquals(body, {
        book: {
            title: 'A new book',
            slug: 'a-new-book',
            author: 'Johan the Brook',
        },
        url: 'https://johan.im/reading/a-new-book/',
    });
});

Deno.test('API /add-book not ok for duplicate slug', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [{
                title: 'American Psycho',
                slug: 'america-psycho',
                author: 'Bret Easton Ellis',
            }, {
                title: 'The Shards',
                slug: 'the-shards',
                author: 'Bret Easton Ellis',
                finished: true,
            }],
        ))
    );

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/add-book', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                title: 'The Shards',
                author: 'Johan the Brook',
            }),
        }),
    );

    assertEquals(res.status, 400);

    const body = await res.text();

    assertMatch(body, /A book with that slug already exists/);
});
