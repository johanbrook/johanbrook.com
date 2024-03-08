import { assertEquals, assertMatch } from 'test_assert';
import { assertSpyCall, assertSpyCalls } from 'test_mock';
import { createApp } from '../api/app.ts';
import { mock } from './_mock.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API /post-note fails on no auth header', async () => {
    const { connectors } = mock();
    const router = createApp(connectors);
    const res = await router.run(
        new Request(new URL('/post-note', BASE_URL), {
            method: 'POST',
        }),
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /Missing important credentials/);
    assertSpyCalls(connectors.github.putFile, 0);
});

Deno.test('API /post-note fails on bad auth header', async () => {
    const { connectors } = mock();
    const router = createApp(connectors);
    const res = await router.run(
        new Request(new URL('/post-note?clientId=ios-shortcut', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ccc',
            },
        }),
    );

    assertEquals(res.status, 401);
    const body = await res.text();
    assertMatch(body, /Bad auth token/);
    assertSpyCalls(connectors.github.putFile, 0);
});

Deno.test('API /post-note fails on bad clientId param', async () => {
    const { connectors } = mock();
    const router = createApp(connectors);
    const res = await router.run(
        new Request(new URL('/post-note?clientId=foo', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
            },
        }),
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /Bad client/);
    assertSpyCalls(connectors.github.putFile, 0);
});

Deno.test('API /post-note ok', async () => {
    const { connectors } = mock();
    const router = createApp(connectors);
    const date = new Date('2024-03-07T08:27:35.438Z');
    const res = await router.run(
        new Request(new URL('/post-note?clientId=ios-shortcut', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                contents: 'foo',
                date: date.toISOString(),
                timezone: 'Asia/Bangkok',
                tags: ['bar', 'baz'],
            }),
        }),
    );

    assertEquals(res.status, 200);
    assertSpyCalls(connectors.github.putFile, 1);
    assertSpyCall(connectors.github.putFile, 0, {
        args: [
            '---\ndate: 2024-03-07T08:27:35.438Z\ntimezone: Asia/Bangkok\ntags:\n  - bar\n  - baz\n---\nfoo\n\n',
            'src/notes/2024-03-07-08-27-35.md',
        ],
    });
});

Deno.test('API /post-note fails to validate body: "contents"', async () => {
    const { connectors } = mock();
    const router = createApp(connectors);
    const res = await router.run(
        new Request(new URL('/post-note?clientId=ios-shortcut', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                // contents: 'foo',
                date: new Date().toISOString(),
            }),
        }),
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /\"contents\" must be a string/);
    assertSpyCalls(connectors.github.putFile, 0);
});

Deno.test('API /post-note fails to validate body: "tags"', async () => {
    const { connectors } = mock();
    const router = createApp(connectors);
    const res = await router.run(
        new Request(new URL('/post-note?clientId=ios-shortcut', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                contents: 'foo',
                date: new Date().toISOString(),
                tags: 'lol',
            }),
        }),
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /\"tags\" must be a string array/);
    assertSpyCalls(connectors.github.putFile, 0);
});

Deno.test('API /post-note fails to validate body: "timezone"', async () => {
    const { connectors } = mock();
    const router = createApp(connectors);
    const res = await router.run(
        new Request(new URL('/post-note?clientId=ios-shortcut', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                contents: 'foo',
                date: new Date().toISOString(),
                timezone: 'Random/Zone',
            }),
        }),
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /\"Random\/Zone\" isn't a correct IANA timezone/);
    assertSpyCalls(connectors.github.putFile, 0);
});
