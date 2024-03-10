import { assertEquals } from 'std/assert/mod.ts';
import { assertSpyCall, assertSpyCalls } from 'std/testing/mock.ts';
import { createApp } from '../api/app.ts';
import { mock, spy } from './_mock.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { assertMatch } from 'std/assert/assert_match.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API /finish-book ok', async () => {
    const { services } = mock();

    services.github.getFile = spy(() =>
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

    const now = new Date();

    const res = await router.run(
        new Request(new URL('/finish-book/the-shards', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                timezone: 'Asia/Bangkok',
                finishedAt: now.toISOString(),
                location: 'Koh Lanta, Thailand',
            }),
        }),
    );

    assertEquals(res.status, 200);

    const body = await res.text();

    assertEquals(body, 'Finished "The Shards"');

    assertSpyCalls(services.github.putFile, 1);
    assertSpyCall(services.github.putFile, 0, {
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
                    finishedAt: now.toISOString(),
                    location: 'Koh Lanta, Thailand',
                    timezone: 'Asia/Bangkok',
                }],
            ),
            'src/_data/books.yml',
        ],
    });
});

Deno.test('API /finish-book with bad slug', async () => {
    const { services } = mock();

    services.github.getFile = spy(() =>
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

    const now = new Date();

    const res = await router.run(
        new Request(new URL('/finish-book/non-existing-book', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                timezone: 'Asia/Bangkok',
                finishedAt: now.toISOString(),
                location: 'Koh Lanta, Thailand',
            }),
        }),
    );

    assertEquals(res.status, 404);

    const body = await res.text();

    assertMatch(body, /No book with slug/);

    assertSpyCalls(services.github.putFile, 0);
});

Deno.test('API /current-book ok', async () => {
    const { services } = mock();

    services.github.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [{
                title: 'American Psycho',
                slug: 'america-psycho',
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
        new Request(new URL('/current-book', BASE_URL), {
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
        title: 'American Psycho',
        slug: 'america-psycho',
        author: 'Bret Easton Ellis',
    });
});

Deno.test('API /add-book ok', async () => {
    const { services } = mock();

    services.github.getFile = spy(() =>
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

    assertEquals(res.status, 200);

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
