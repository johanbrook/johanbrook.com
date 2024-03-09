import * as Yaml from 'std/yaml/mod.ts';

export const addFrontMatter = <T extends Record<string, unknown>>(
    contents: string,
    fm: T,
): string => {
    const copy = { ...fm };
    // YAML doesn't like undefined
    for (const k of Object.keys(copy)) {
        if (typeof copy[k] == 'undefined') {
            delete copy[k];
        }
    }

    return `---
${Yaml.stringify(copy).trim()}
---
${contents}\n
`;
};
