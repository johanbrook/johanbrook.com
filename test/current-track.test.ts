import { assertEquals } from 'std/assert/mod.ts';
import { createApp } from '../api/app.ts';
import { mock } from './_mock.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { assertSpyCall, assertSpyCalls } from 'std/testing/mock.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API PUT /current-track ok', async () => {
    const { services } = mock();

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/current-track', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                name: 'With Or Without You',
                artist: 'U2',
            }),
        }),
    );

    assertEquals(res.status, 200);

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            Yaml.stringify(
                {
                    name: 'With Or Without You',
                    artist: 'U2',
                },
            ),
            'src/_data/current_track.yml',
        ],
    });
});

Deno.test('API PUT /current-track always capitalises track name and artist', async () => {
    const { services } = mock();

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/current-track', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                name: 'with Or without you  ',
                artist: '  u2',
            }),
        }),
    );

    assertEquals(res.status, 200);

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            Yaml.stringify(
                {
                    name: 'With Or Without You',
                    artist: 'U2',
                },
            ),
            'src/_data/current_track.yml',
        ],
    });
});
