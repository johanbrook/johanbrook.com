interface Config {
    /** For authing with the GitHub API. */
    GITHUB_TOKEN: string;
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;

    // Access tokens for this API
    IOS_SHORTCUT_TOKEN: string;
    MAC_SHORTCUT_TOKEN: string;

    // https://johan.im
    ROOT_URL: string;
}

export const getConfig = <K extends keyof Config>(key: K, def?: Config[K]): Config[K] => {
    const val = Deno.env.get(key);

    if (!val) {
        if (def != null) return def;

        // Cannot do Deno.exit(1) in Deno deploy?
        throw new Error(`Config doesn't exist as env var: ${key}`);
    }

    return val;
};

export const isTest = () => !!Deno.env.get('TEST');

export const isDebug = () => !!Deno.env.get('DEBUG');
