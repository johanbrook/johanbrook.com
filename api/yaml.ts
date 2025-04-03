import * as Yaml from 'std/yaml/mod.ts';

export const yamlParse = <T>(str: string, opts?: Yaml.ParseOptions) => {
    return Yaml.parse(str, opts) as T;
};

type Input = Array<any> | Record<string, any>;

export const yamlStringify = <T extends Input>(t: T, opts?: Yaml.DumpOptions): string => {
    const c = Array.isArray(t) ? [...t] : { ...t };
    const todo = clean(c);
    // The types lie
    return Yaml.stringify(todo as any, opts);
};

// Mutates `t`
const clean = <T extends Input>(t: T) => {
    if (Array.isArray(t)) {
        for (const k of t) {
            clean(k);
        }
    } else {
        removeUndefined(t);
    }

    return t;
};

// YAML doesn't like undefined
const removeUndefined = (o: Record<string, any>) => {
    for (const k of Object.keys(o)) {
        if (typeof o[k] == 'undefined') {
            delete o[k];
        }
    }
};
