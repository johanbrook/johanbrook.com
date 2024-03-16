import { isTest } from '../config.ts';
import { FileHost } from './index.ts';
import { join } from 'std/path/mod.ts';

export const createLocal = (): FileHost => {
    if (!isTest()) console.log('Using local file host');

    return {
        putFile: async (contents, filePath) => {
            filePath = join(Deno.cwd(), filePath);
            await Deno.writeTextFile(filePath, contents);
            return filePath;
        },
        getFile: async (filePath) => {
            filePath = join(Deno.cwd(), filePath);
            return await Deno.readTextFile(filePath);
        },
    };
};
