import { assertEquals, assertMatch } from 'std/assert/mod.ts';
import { assertSpyCall, assertSpyCalls } from 'std/testing/mock.ts';
import { createApp } from '../api/app.ts';
import { mock } from './_mock.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API /post-note ok', async () => {
    const { services } = mock();
    const router = createApp(services);
    const date = Temporal.ZonedDateTime.from('2024-03-07T08:27:35[Asia/Bangkok]');
    const res = await router.run(
        new Request(new URL('/post-note', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                contents: 'foo',
                date: date,
                tags: 'bar,baz',
            }),
        }),
    );

    assertEquals(res.status, 201);

    assertEquals(res.headers.get('Location'), 'https://johan.im/micro/20240307082735/');

    const body = await res.json();

    assertEquals(body, {
        url: 'https://johan.im/micro/20240307082735/',
    });

    assertSpyCalls(services.github.putFile, 1);
    assertSpyCall(services.github.putFile, 0, {
        args: [
            `---\ndate: '2024-03-07T08:27:35+07:00'\ntimezone: Asia/Bangkok\ntags:\n    - bar\n    - baz\n---\nfoo\n\n`,
            'src/notes/2024-03-07-08-27-35.md',
        ],
    });
});

Deno.test('API /post-note fails to validate body: "contents"', async () => {
    const { services } = mock();
    const router = createApp(services);
    const res = await router.run(
        new Request(new URL('/post-note', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                // contents: 'foo',
                date: Temporal.Now.zonedDateTimeISO(),
            }),
        }),
    );

    assertEquals(res.status, 400);
    const body = await res.text();
    assertMatch(body, /\"contents\" must be a string/);
    assertSpyCalls(services.github.putFile, 0);
});
