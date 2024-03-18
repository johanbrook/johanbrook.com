import { assertEquals } from 'std/assert/mod.ts';
import { createApp } from '../api/app.ts';
import { mock } from './_mock.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API GET /check-auth ok', async () => {
    const { services } = mock();

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/check-auth', BASE_URL), {
            method: 'GET',
            headers: {
                Authorization: 'API-Token aaa',
            },
        }),
    );

    assertEquals(res.status, 200);
    assertEquals(await res.text(), 'Authed as mac-shortcut');
});
