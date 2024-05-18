import { assertEquals } from 'std/assert/mod.ts';
import { assertSpyCall, assertSpyCalls, spy } from 'std/testing/mock.ts';
import { createApp } from '../api/app.ts';
import { mock } from './_mock.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API /add-media creates if not exists ok', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() => Promise.resolve(null));

    const router = createApp(services);
    const date = Temporal.ZonedDateTime.from('2024-03-07T08:27:35[Asia/Bangkok]');
    const res = await router.run(
        new Request(new URL('/add-media', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                contents: 'Some movie I watched',
                date: date,
                tags: 'bar,baz',
            }),
        }),
    );

    assertEquals(res.status, 200);

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            `---\ndate: '2024-03-07T08:27:35+07:00'\ntimezone: Asia/Bangkok\ntags:\n    - bar\n    - baz\n    - recently\n---\n## Uncategorised\n\n- Some movie I watched\n\n`,
            'src/notes/_CURRENT.md',
        ],
    });
});

Deno.test('API /add-media appends if exists ok', async () => {
    const { services } = mock();

    services.fileHost.getFile = spy(() => Promise.resolve(`---
date: '2024-03-07T08:27:35+07:00'
timezone: Asia/Bangkok
tags:
  - bar
  - baz
  - recently
---
## Movies

- The Godfather

## Uncategorised

- A music track
`));

    const router = createApp(services);
    const date = Temporal.ZonedDateTime.from('2024-03-07T08:27:35[Asia/Bangkok]');
    const res = await router.run(
        new Request(new URL('/add-media', BASE_URL), {
            method: 'POST',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                contents: 'Some movie I watched',
                date: date,
                tags: 'bar,baz',
            }),
        }),
    );

    assertEquals(res.status, 200);

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            `---\ndate: '2024-03-07T08:27:35+07:00'\ntimezone: Asia/Bangkok\ntags:\n    - bar\n    - baz\n    - recently\n---\n## Movies\n\n- The Godfather\n\n## Uncategorised\n\n- A music track\n- Some movie I watched\n\n`,
            'src/notes/_CURRENT.md',
        ],
    });
});
