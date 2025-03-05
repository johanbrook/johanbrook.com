import { encodeBase64 } from 'jsr:@std/encoding/base64';
import { slug } from 'slug';
import { type WishListBook } from '../api/model/wishlist.ts';

// Rewritten from Python (https://github.com/subdavis/kobo-book-downloader/blob/main/kobodl/kobo.py) by Johan.
// Huge props to the great reverse engineering by them.

const TOKEN_PATH = './.kobo';

// deno run --allow-net --allow-read --allow-write ./script/fetch-kobo-wishlist.ts
const main = async () => {
    try {
        const auth = await acquireAccessToken();

        const settings = await loadInitSettings(auth);
        const wishlist = await fetchWishlist(auth, settings.user_wishlist);

        const books = wishlist.map<WishListBook>((w) => ({
            title: w.ProductMetadata.Book.Title,
            author: w.ProductMetadata.Book.Contributors,
            slug: slug(w.ProductMetadata.Book.Title),
            addedAt: w.DateAdded,
        }));

        console.log(books);
    } catch (error) {
        console.error(error);
    }
};

const Kobo = {
    Affiliate: 'Kobo',
    ApplicationVersion: '4.38.23171',
    CarrierName: '310270',
    DefaultPlatformId: '00000000-0000-0000-0000-000000000373',
    DeviceModel: 'Kobo Aura ONE',
    DeviceOs: '3.0.35+',
    DeviceOsVersion: 'NA',
    DisplayProfile: 'Android',
    UserAgent:
        'Mozilla/5.0 (Linux; U; Android 2.0; en-us;) AppleWebKit/538.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/538.1 (Kobo Touch 0373/4.38.23171)',
};

interface Auth {
    accessToken: string;
    refreshToken: string;
}

// 1. authenticateDevice() with null creds
// 2. login() does "activation"
// 3. authenticateDevice() again with user from 1) and key from 2)
const acquireAccessToken = async (): Promise<Auth> => {
    const existingTokens = await readTokens(TOKEN_PATH);

    if (existingTokens) {
        console.log('> Found existing tokens');
        return existingTokens;
    }

    console.log('> Acquiring new access token');
    const { user } = await authenticateDevice(null, null);
    const userKey = await login();

    const { auth } = await authenticateDevice(user, userKey);

    if (!existingTokens) await writeTokens(auth);

    return auth;
};

const waitForActivation = async (activationUrl: string) => {
    while (true) {
        printOverwrite('Waiting for activation…');

        const res = await fetch(activationUrl, {
            headers: {
                ...defaultHeaders(true),
            },
        });

        if (!res.ok) throw new Error(`waitForActivation: Bad status ${res.status}`);

        const json = await res.json();

        if (json['Status'] == 'Complete') {
            return {
                userEmail: json['UserEmail'] as string,
                userId: json['UserId'] as string,
                userKey: json['UserKey'] as string,
            };
        }

        await sleep(1_000);
    }
};

const activateOnWeb = async () => {
    console.log('Initiating web-based activation');

    const params = {
        'pwsdid': crypto.randomUUID(),
        'pwspid': Kobo.DefaultPlatformId,
        'wsa': Kobo.Affiliate,
        'pwsav': Kobo.ApplicationVersion,
        'pwsdm': Kobo.DefaultPlatformId,
        'pwspos': Kobo.DeviceOs,
        'pwspov': Kobo.DeviceOsVersion,
    };

    const requestUrl = new URL('https://auth.kobobooks.com/ActivateOnWeb');
    for (const [k, v] of Object.entries(params)) {
        requestUrl.searchParams.append(k, v);
    }

    const res = await fetch(requestUrl, {
        headers: {
            ...defaultHeaders(false),
        },
    });

    if (!res.ok) throw new Error(`activateOnWeb: Bad status ${res.status}`);

    const html = await res.text();

    let match = html.match(/data-poll-endpoint="([^"]+)"/);

    if (!match) throw new Error(`Can't find poll endpoint in HTML`);

    const activationUrl = 'https://auth.kobobooks.com' + match[1];

    match = html.match(/qrcodegenerator\/generate.+?%26code%3D(\d+)/);

    if (!match) throw new Error(`Can't find activation code in response`);

    const activationCode = match[1];

    return { activationUrl, activationCode };
};

interface User {
    deviceId: string;
    serialNumber: string;
    key: string | null;
}

const authenticateDevice = async (user: User | null, userKey: string | null) => {
    if (!user) {
        user = {
            deviceId: randomHexString(64),
            serialNumber: randomHexString(32),
            key: null,
        };
    }

    const postData: any = {
        'AffiliateName': Kobo.Affiliate,
        'AppVersion': Kobo.ApplicationVersion,
        'ClientKey': encodeBase64(Kobo.DefaultPlatformId),
        'DeviceId': user!.deviceId,
        'SerialNumber': user!.serialNumber,
        'PlatformId': Kobo.DefaultPlatformId,
    };

    if (userKey) {
        postData.UserKey = userKey;
    }

    const res = await fetch('https://storeapi.kobo.com/v1/auth/device', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            ...defaultHeaders(true),
        },
    });

    if (!res.ok) throw new Error(`authenticateDevice: Bad status ${res.status}`);

    const json = await res.json();

    if (json.TokenType != 'Bearer') {
        throw new Error(`Device authentication returned with an unsupported token type: ${json.TokenType}`);
    }

    const accessToken: string = json.AccessToken;
    const refreshToken: string = json.RefreshToken;

    if (userKey) {
        user.key = userKey;
    }

    return { user, auth: { accessToken, refreshToken } };
};

type Settings = {
    user_wishlist: string;
    [k: string]: unknown;
};

const loadInitSettings = async (auth: Auth): Promise<Settings> => {
    const res = await fetch('https://storeapi.kobo.com/v1/initialization', {
        headers: {
            ...defaultHeaders(true),
            ...authHeaders(auth.accessToken),
        },
    });

    if (!res.ok) throw new Error(`loadInitSettings: Bad status ${res.status}`);

    const json = await res.json();

    return json.Resources;
};

const login = async () => {
    const { activationUrl, activationCode } = await activateOnWeb();

    console.log(`Open https://www.kobo.com/activate and enter: ${activationCode}`);

    const { userKey } = await waitForActivation(activationUrl);

    return userKey;
};

const refreshAuth = async (auth: Auth): Promise<Auth> => {
    const postData = {
        'AppVersion': Kobo.ApplicationVersion,
        'ClientKey': encodeBase64(Kobo.DefaultPlatformId),
        'PlatformId': Kobo.DefaultPlatformId,
        'RefreshToken': auth.refreshToken,
    };

    const res = await fetch('https://storeapi.kobo.com/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            ...authHeaders(auth.accessToken),
            ...defaultHeaders(true),
        },
    });

    if (!res.ok) throw new Error(`authenticateDevice: Bad status ${res.status}`);

    const json = await res.json();

    if (json.TokenType != 'Bearer') {
        throw new Error(`refreshAuth: returned with an unsupported token type: ${json.TokenType}`);
    }

    return { accessToken: json.AccessToken as string, refreshToken: json.RefreshToken as string };
};

const fetchWithRefresh = async (auth: Auth, input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    const res = await fetch(req);

    if (res.status != 401) return res;

    console.log(`> Got status 401, refreshing auth`);

    // Need to refresh auth
    const newTokens = await refreshAuth(auth);
    const retriedReq = req.clone();

    const { Authorization: bearer } = authHeaders(newTokens.accessToken);
    retriedReq.headers.set('Authorization', bearer);

    const retried = await fetch(retriedReq);

    if (retried.ok) {
        console.log(`> Writing new auth tokens after refresh`);
        await writeTokens(newTokens);
    }

    return retried;
};

const fetchWishlist = async (auth: Auth, wishlistUrl: string) => {
    const items = [];
    let page = 0;

    while (true) {
        const url = new URL(wishlistUrl);
        url.searchParams.append('PageIndex', String(page));
        url.searchParams.append('PageSize', '100');

        const res = await fetchWithRefresh(auth, url, {
            headers: {
                ...defaultHeaders(true),
                ...authHeaders(auth.accessToken),
            },
        });

        if (!res.ok) throw new Error(`fetchWishlist: Bad status ${res.status}`);

        const json = await res.json();

        for (const it of json.Items) items.push(it);

        page += 1;

        if (page >= json.TotalPageCount) break;
    }

    return items;
};

// UTILS
// ==================================================

const authHeaders = (accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
});

const defaultHeaders = (json: boolean) => {
    return {
        'User-Agent': Kobo.UserAgent,
        'X-Requested-With': 'com.kobobooks.android',
        'x-kobo-affiliatename': Kobo.Affiliate,
        'x-kobo-appversion': Kobo.ApplicationVersion,
        'x-kobo-carriername': Kobo.CarrierName,
        'x-kobo-devicemodel': Kobo.DeviceModel,
        'x-kobo-deviceos': Kobo.DisplayProfile,
        'x-kobo-deviceosversion': Kobo.DeviceOsVersion,
        'x-kobo-platformid': Kobo.DefaultPlatformId,
        ...(json ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/x-www-form-urlencoded' }),
    };
};

const sleep = (ms: number) => new Promise((rs) => setTimeout(rs, ms));

const printOverwrite = async (str: string) => {
    const enc = new TextEncoder().encode(str + '\r');
    await Deno.stdout.write(enc);
};

const readTokens = async (path: string): Promise<Auth | null> => {
    try {
        const str = await Deno.readTextFile(path);
        if (!str.trim().length) return null;
        const tokens = str.split('\n');
        if (tokens.length < 2) return null;
        return { accessToken: tokens[0], refreshToken: tokens[1] };
    } catch (ex) {
        if (!(ex instanceof Deno.errors.NotFound)) {
            throw ex;
        }

        return null;
    }
};

const writeTokens = async (tokens: Auth) => {
    await Deno.writeTextFile(TOKEN_PATH, `${tokens.accessToken}\n${tokens.refreshToken}`);
};

const randomHexString = (len: number) => {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, len);
};

// Run!
if (import.meta.main) {
    main();
}
