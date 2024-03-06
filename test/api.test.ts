import { assertEquals, assertMatch } from 'https://deno.land/std@0.218.2/assert/mod.ts';
import { mkApp } from '../api/app.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API /post-note fails on no auth header', async () => {
    const router = mkApp();
    const res = await router.run(
        new Request(new URL('/post-note', BASE_URL), {
            method: 'POST',
        })
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /Missing important credentials/);
});

Deno.test('API /post-note fails on bad auth header', async () => {
    const router = mkApp();
    const res = await router.run(
        new Request(new URL('/post-note?clientId=ios-shortcut', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ccc',
            },
        })
    );

    assertEquals(res.status, 401);
    const body = await res.text();
    assertMatch(body, /Bad auth token/);
});

Deno.test('API /post-note fails on bad clientId param', async () => {
    const router = mkApp();
    const res = await router.run(
        new Request(new URL('/post-note?clientId=foo', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
            },
        })
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /Bad client/);
});

Deno.test('API /post-note ok', async () => {
    const router = mkApp();
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
            }),
        })
    );

    assertEquals(res.status, 200);
});

Deno.test('API /post-note fails to validate body', async () => {
    const router = mkApp();
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
        })
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /\"contents\" must be a string/);
});
