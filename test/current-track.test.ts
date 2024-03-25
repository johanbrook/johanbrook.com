import { assertEquals } from 'std/assert/mod.ts';
import { createApp } from '../api/app.ts';
import { mock } from './_mock.ts';
import * as Yaml from 'std/yaml/mod.ts';
import { assertSpyCall, assertSpyCalls } from 'std/testing/mock.ts';
import 'temporal-polyfill/global';
import { assertMatch } from 'std/assert/assert_match.ts';

const BASE_URL = 'http://localhost:8000';

Deno.test('API PUT /current-track ok', async () => {
    const now = new Date();
    const { services } = mock({ currentTime: now });

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
                    updatedAt: now,
                },
            ),
            'src/_data/current_track.yml',
        ],
    });
});

Deno.test('API PUT /current-track always capitalises track name and artist', async () => {
    const now = new Date();
    const { services } = mock({ currentTime: now });

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
                    updatedAt: now,
                },
            ),
            'src/_data/current_track.yml',
        ],
    });
});

Deno.test('API PUT /current-track/spotify ok', async () => {
    const now = new Date();
    const { services } = mock({ currentTime: now });

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/current-track/spotify', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                url: 'https://open.spotify.com/track/2BDpUaDPm0kSO9Ye1BZTch?si=2771e4e0f68a4626',
            }),
        }),
    );

    assertEquals(res.status, 200);

    assertSpyCalls(services.fileHost.putFile, 1);
    assertSpyCall(services.fileHost.putFile, 0, {
        args: [
            Yaml.stringify(
                {
                    name: 'Hitchiker',
                    artist: 'Neil Young',
                    updatedAt: now,
                },
            ),
            'src/_data/current_track.yml',
        ],
    });
});

Deno.test('API PUT /current-track/spotify not ok for malformed Spotify URL', async () => {
    const { services } = mock();

    const router = createApp(services);

    const res = await router.run(
        new Request(new URL('/current-track/spotify', BASE_URL), {
            method: 'PUT',
            headers: {
                Authorization: 'API-Token aaa',
                ContentType: 'application/json',
            },
            body: JSON.stringify({
                url: 'https://open.spotify.com/album/6rqhFgbbKwnb9MLmUQDhG6?si=2771e4e0f68a4626',
            }),
        }),
    );

    assertEquals(res.status, 400);

    const body = await res.text();

    assertMatch(body, /Spotify URL has to be a \/track URL/);
});
