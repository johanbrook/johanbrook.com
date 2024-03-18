interface Config {
    /** For authing with the GitHub API. */
    GITHUB_TOKEN: string;

    // Access tokens for this API
    IOS_SHORTCUT_TOKEN: string;
    MAC_SHORTCUT_TOKEN: string;
}

export const getConfig = <K extends keyof Config>(key: K, def?: Config[K]): Config[K] => {
    const val = Deno.env.get(key);

    if (!val) {
        if (def != null) return def;

        console.error(`Config doesn't exist as env var: ${key}`);
        Deno.exit(1);
    }

    return val;
};

export const isTest = () => !!Deno.env.get('TEST');

export const isDebug = () => !!Deno.env.get('DEBUG');
