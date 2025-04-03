import { assertEquals } from 'std/assert/mod.ts';
import { createApp } from '../api/app.ts';
import { mock, spy } from './_mock.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { assertMatch } from 'std/assert/assert_match.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API /reading-list ok', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [{
                title: 'American Psycho',
                author: 'Bret Easton Ellis',
            }, {
                title: 'The Shards',
                author: 'Bret Easton Ellis',
            }],
        ))
    );

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/reading-list', BASE_URL), {
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

    const body = await res.json();

    assertEquals(body, {
        book: {
            title: 'A new book',
            author: 'Johan the Brook',
        },
        url: 'https://johan.im/reading-list',
    });
});

Deno.test('API /reading-list not ok for duplicate slug', async () => {
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
