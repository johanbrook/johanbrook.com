import { assertEquals, assertMatch } from 'std/assert/mod.ts';
import { createApp } from '../api/app.ts';
import { mock } from './_mock.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API /post-note fails on no auth header', async () => {
    const { services } = mock();
    const router = createApp(services);
    const res = await router.run(
        new Request(new URL('/post-note', BASE_URL), {
            method: 'POST',
        }),
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /Missing important credentials/);
});

Deno.test('API /post-note fails on bad auth header', async () => {
    const { services } = mock();
    const router = createApp(services);
    const res = await router.run(
        new Request(new URL('/post-note', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ccc',
            },
        }),
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /Malformed auth token/);
});
