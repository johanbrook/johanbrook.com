import { assertEquals } from 'std/assert/mod.ts';
import { createApp } from '../api/app.ts';
import { mock, spy } from './_mock.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { assertMatch } from 'std/assert/assert_match.ts';
import { assertSpyCalls } from 'std/testing/mock.ts';
import { yamlParse } from '../api/yaml.ts';

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

    let leakedPutFile: string = '';

    services.fileHost.putFile = spy((str: string, filePath: string) => {
        leakedPutFile = str;
        return filePath;
    });

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
                source: 'kobo',
            }),
        }),
    );

    assertEquals(res.status, 201);

    const body = await res.json();

    assertEquals(body, {
        books: [{
            title: 'A new book',
            author: 'Johan the Brook',
            source: 'kobo',
        }],
        count: 1,
        url: 'https://johan.im/reading-list',
    });

    // Nobody wants to assert YAML strings. Nobody.
    const json = yamlParse(leakedPutFile);

    assertEquals(
        json,
        [{
            title: 'American Psycho',
            author: 'Bret Easton Ellis',
        }, {
            title: 'The Shards',
            author: 'Bret Easton Ellis',
        }, {
            title: 'A new book',
            author: 'Johan the Brook',
            source: 'kobo',
        }],
    );
});

Deno.test('API /reading-list accepts array', async () => {
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
            body: JSON.stringify([{
                title: 'A new book',
                author: 'Johan the Brook',
            }, {
                title: 'Ziggy Stardust',
                author: 'David Bowie',
            }]),
        }),
    );

    assertEquals(res.status, 201);

    const body = await res.json();

    assertEquals(body, {
        books: [{
            title: 'A new book',
            author: 'Johan the Brook',
        }, {
            title: 'Ziggy Stardust',
            author: 'David Bowie',
        }],
        count: 2,
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

Deno.test('API /reading-list/sync-kobo ok', async (t) => {
    const { services } = mock();

    services.fileHost.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [
                {
                    title: 'American Psycho',
                    author: 'Bret Easton Ellis',
                    source: 'kobo',
                }, // Can't touch this
                {
                    title: 'The Shards',
                    author: 'Bret Easton Ellis',
                },
            ],
        ))
    );

    let leakedPutFile: string = '';

    services.fileHost.putFile = spy((str: string, filePath: string) => {
        leakedPutFile = str;
        return filePath;
    });

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/reading-list/sync-kobo', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify([
                // This was removed from the existing list above
                // {
                //     title: 'American Psycho',
                //     author: 'Bret Easton Ellis',
                //     source: 'kobo',
                // },
                {
                    //
                    title: 'A new book',
                    author: 'Johan the Brook',
                    source: 'kobo',
                },
            ]),
        }),
    );

    assertEquals(res.status, 201);

    const body = await res.json();

    assertEquals(body, {
        url: 'https://johan.im/reading-list',
    });

    assertSpyCalls(services.fileHost.putFile, 1);

    // Nobody wants to assert YAML strings. Nobody.
    const json = yamlParse(leakedPutFile);

    assertEquals(
        json,
        [{
            title: 'The Shards',
            author: 'Bret Easton Ellis',
        }, {
            title: 'A new book',
            author: 'Johan the Brook',
            source: 'kobo',
        }],
    );
});

Deno.test('API /reading-list/sync-kobo no changes', async (t) => {
    const { services } = mock();

    services.fileHost.getFile = spy(() =>
        Promise.resolve(Yaml.stringify(
            // stringify() _does_ accept an array, but the types say no...
            // @ts-ignore-next
            [
                {
                    title: 'American Psycho',
                    author: 'Bret Easton Ellis',
                    source: 'kobo',
                },
                {
                    title: 'The Shards',
                    author: 'Bret Easton Ellis',
                },
            ],
        ))
    );

    let leakedPutFile: string = '';

    services.fileHost.putFile = spy((str: string, filePath: string) => {
        leakedPutFile = str;
        return filePath;
    });

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/reading-list/sync-kobo', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify([
                {
                    title: 'American Psycho',
                    author: 'Bret Easton Ellis',
                    source: 'kobo',
                },
            ]),
        }),
    );

    assertEquals(res.status, 201);

    const body = await res.json();

    assertEquals(body, {
        url: 'https://johan.im/reading-list',
    });

    assertSpyCalls(services.fileHost.putFile, 0);
});
