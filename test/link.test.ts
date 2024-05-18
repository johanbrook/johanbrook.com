import { assertEquals } from 'std/assert/mod.ts';
import { assertSpyCall, assertSpyCalls } from 'std/testing/mock.ts';
import { createApp } from '../api/app.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { mock, spy } from './_mock.ts';

const BASE_URL = 'http://localhost:8000';

const SEED = Yaml.stringify(
    // stringify() _does_ accept an array, but the types say no...
    // @ts-ignore-next
    [{
        url: 'http://johan.im',
    }, {
        url: 'http://hachyderm.io',
        title: 'Hachyderm',
    }],
);

Deno.test('API POST /add-link ok', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() => Promise.resolve(SEED));

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/add-link', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                url: 'http://example.com',
                notes: 'some notes',
            }),
        }),
    );

    assertEquals(res.status, 201);

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            SEED + `\n- url: 'http://example.com'\n  notes: some notes\n`,
            'src/_data/links.yml',
        ],
    });
});

Deno.test('API POST /add-link notes are optional', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() => Promise.resolve(SEED));

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/add-link', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                url: 'http://example.com',
            }),
        }),
    );

    assertEquals(res.status, 201);

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            SEED + `\n- url: 'http://example.com'\n`,
            'src/_data/links.yml',
        ],
    });
});

Deno.test('API POST /add-link empty notes string is ok', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() => Promise.resolve(SEED));

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/add-link', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                url: 'http://example.com',
                notes: '',
            }),
        }),
    );

    assertEquals(res.status, 201);

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            SEED + `\n- url: 'http://example.com'\n`,
            'src/_data/links.yml',
        ],
    });
});
