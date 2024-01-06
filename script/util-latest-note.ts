import * as path from 'path';

const NOTES_DIR = 'src/notes';

export const latestNote = async (): Promise<[string, string]> => {
    const latest: string = await Array.fromAsync(Deno.readDir(new URL('../' + NOTES_DIR, import.meta.url))).then((fs) =>
        fs
            .filter((f) => f.isFile && path.extname(f.name) == '.md')
            .map((f) => f.name)
            .sort()
            .at(-1)
    );

    // 2023-01-01-04-30-30.md -> 202301010430
    const latestId = latest.replaceAll('-', '').split('.').at(0);

    return [latestId, path.join(NOTES_DIR, latest)];
};
