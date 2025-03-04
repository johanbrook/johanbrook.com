import { encodeBase64 } from 'jsr:@std/encoding/base64';
import { DOMParser } from 'jsr:@b-fuze/deno-dom';

// Rewritten from Python (https://github.com/subdavis/kobo-book-downloader/blob/main/kobodl/kobo.py) by Johan.
// Huge props to the great reverse engineering by them.

const Kobo = {
    Affiliate: 'Kobo',
    ApplicationVersion: '10.1.2.39807',
    CarrierName: '310270',
    DefaultPlatformId: '00000000-0000-0000-0000-000000004000',
    DeviceModel: 'Pixel',
    DeviceOsVersion: '33',
    DisplayProfile: 'Android',
    UserAgent:
        'Mozilla/5.0 (Linux; Android 13; Pixel Build/TQ2B.230505.005.A1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 KoboApp/10.1.2.39807 KoboPlatform Id/00000000-0000-0000-0000-000000004000 KoboAffiliate/Kobo KoboBuildFlavor/global',
};

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

const loadInitSettings = async (accessToken: string): Promise<Settings> => {
    const res = await fetch('https://storeapi.kobo.com/v1/initialization', {
        headers: {
            ...defaultHeaders(true),
            ...authHeaders(accessToken),
        },
    });

    if (!res.ok) throw new Error(`loadInitSettings: Bad status ${res.status}`);

    const json = await res.json();

    return json.Resources;
};

const loginParams = async (signInUrl: string, deviceId: string) => {
    const params = {
        'wsa': Kobo.Affiliate,
        'pwsav': Kobo.ApplicationVersion,
        'pwspid': Kobo.DefaultPlatformId,
        'pwsdid': deviceId,
        'wscfv': '1.5',
        'wscf': 'kepub',
        'wsmc': Kobo.CarrierName,
        'pwspov': Kobo.DeviceOsVersion,
        'pwspt': 'Mobile',
        'pwsdm': Kobo.DeviceModel,
    };

    const requestUrl = new URL(signInUrl);
    for (const [k, v] of Object.entries(params)) {
        requestUrl.searchParams.append(k, v);
    }

    const res = await fetch(requestUrl, {
        headers: {
            ...defaultHeaders(true),
        },
    });

    if (!res.ok) throw new Error(`loginParams: Bad status ${res.status}`);

    const html = await res.text();
    const koboSigninUrl = URL.parse(signInUrl);
    if (!koboSigninUrl) throw new Error(`Couldn't parse signin URL: ${signInUrl}`);
    koboSigninUrl.search = '';
    koboSigninUrl.pathname = '/za/en/signin/signin';

    let match = html.match(/\?workflowId=([^"]{36})/);

    if (!match) throw new Error(`Can't find the workflow ID in the login form`);

    const workflowId = match[1];

    match = html.match(/<input name="__RequestVerificationToken" type="hidden" value="([^"]+)" \/>/);

    if (!match) throw new Error(`Can't find the request verification token in the login form`);

    const requestVerificationToken = match[1];

    return { koboSigninUrl, workflowId, requestVerificationToken };
};

const authenticateDevice = async (deviceId: string, userKey: string = '') => {
    const postData: any = {
        'AffiliateName': Kobo.Affiliate,
        'AppVersion': Kobo.ApplicationVersion,
        'ClientKey': encodeBase64(Kobo.DefaultPlatformId),
        'DeviceId': deviceId,
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

    return {
        accessToken: json.AccessToken,
        refreshToken: json.RefreshToken,
        ...(userKey ? { userKey: json.UserKey } : {}),
    };
};

interface Creds {
    email: string;
    password: string;
    captcha: string;
}

type Settings = {
    sign_in_page: string;
    user_wishlist: string;
    [k: string]: unknown;
};

const login = async (creds: Creds, settings: Settings, deviceId: string) => {
    const {
        koboSigninUrl,
        workflowId,
        requestVerificationToken,
    } = await loginParams(settings.sign_in_page, deviceId);

    const postData = {
        'LogInModel.WorkflowId': workflowId,
        'LogInModel.Provider': Kobo.Affiliate,
        'ReturnUrl': '',
        '__RequestVerificationToken': requestVerificationToken,
        'LogInModel.UserName': creds.email,
        'LogInModel.Password': creds.password,
        'g-recaptcha-response': creds.captcha,
        'h-captcha-response': creds.captcha,
    };

    const res = await fetch(koboSigninUrl, {
        method: 'POST',
        headers: {
            ...defaultHeaders(false),
        },
        body: new URLSearchParams(postData),
    });

    if (!res.ok) throw new Error(`login: Bad status ${res.status}`);

    const html = await res.text();

    const match = html.match(/'(kobo:\/\/UserAuthenticated\?[^']+)';/);

    if (!match) {
        const doc = new DOMParser().parseFromString(
            html,
            'text/html',
        );

        const field = doc.querySelector('.validation-summary-errors') || doc.querySelector('.field-validation-error');
        throw new Error(`Error message from login page: ${field?.textContent}`);
    }

    const url = new URL(match[1]);
    const userId = url.searchParams.get('userId');
    const userKey = url.searchParams.get('userKey');

    if (!userId || !userKey) {
        throw new Error(`login: No userId or userKey in search params: ${url.searchParams.toString()}`);
    }

    return { userId, userKey };
};

const fetchWishlist = async (accessToken: string, wishlistUrl: string) => {
    const items = [];
    let page = 0;

    while (true) {
        const url = new URL(wishlistUrl);
        url.searchParams.append('PageIndex', String(page));
        url.searchParams.append('PageSize', '100');

        const res = await fetch(url, {
            headers: {
                ...defaultHeaders(true),
                ...authHeaders(accessToken),
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

// 1. authenticateDevice()
// 2. loadInitSettings()
// 3. login()
// deno run --allow-net ./script/fetch-kobo-wishlist.ts $KOBO_LOGIN $KOBO_PASS $KOBO_CAPTCHA
const main = async () => {
    if (Deno.args.length < 3) {
        console.error('Usage: deno run --allow-net script.ts <email> <password> <captcha>');
        return;
    }

    const [email, password, captcha] = Deno.args;
    try {
        const deviceId = crypto.randomUUID();

        let { accessToken } = await authenticateDevice(deviceId);
        const settings = await loadInitSettings(accessToken);
        const { userKey } = await login({ email, password, captcha }, settings, deviceId);

        accessToken = (await authenticateDevice(deviceId, userKey)).accessToken;

        const wishlist = await fetchWishlist(accessToken, settings.user_wishlist);
        console.log(JSON.stringify(wishlist, null, 2));
    } catch (error) {
        console.error(error);
    }
};

if (import.meta.main) {
    main();
}
