import { prism as Prism } from '../../deps.ts';
import type { Page, Site } from 'lume/core.ts';

export interface Options {
    /** The list of extensions this plugin applies to */
    extensions: string[];
    cssSelector: string;
}

// Default options
export const defaults: Options = {
    extensions: ['.html'],
    cssSelector: 'pre code',
};

/** A plugin to syntax-highlight code using the PrismJS library */
export default function (userOptions?: Partial<Options>) {
    const options = { ...defaults, ...userOptions };

    return (site: Site) => {
        addTsLang(Prism);
        addJsonLang(Prism);

        site.process(options.extensions, highlight);

        function highlight(page: Page) {
            page.document!.querySelectorAll(options.cssSelector).forEach(
                (node) => {
                    Prism.highlightElement(node as unknown as HTMLElement);
                }
            );
        }
    };
}

// From https://github.com/PrismJS/prism/blob/master/components/prism-typescript.js
const addTsLang = (p: typeof Prism) => {
    const grammar = p.languages.extend('javascript', {
        'class-name': {
            pattern:
                /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
            lookbehind: true,
            greedy: true,
            inside: null as any, // see below
        },
        builtin:
            /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/,
    });

    p.languages.ts = grammar;
    p.languages.typescript = grammar;

    // The keywords TypeScript adds to JavaScript
    if (Array.isArray(grammar.keyword)) {
        grammar.keyword.push(
            /\b(?:abstract|declare|is|keyof|readonly|require)\b/,
            // keywords that have to be followed by an identifier
            /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
            // This is for `import type *, {}`
            /\btype\b(?=\s*(?:[\{*]|$))/
        );
    }

    // doesn't work with TS because TS is too complex
    delete grammar['parameter'];
    delete grammar['literal-property'];

    // a version of typescript specifically for highlighting types
    const typeInside = p.languages.extend('typescript', {});
    delete typeInside['class-name'];

    const isTokenObject = (t: any): t is Prism.TokenObject => !!t.inside;

    if (isTokenObject(grammar['class-name'])) {
        grammar['class-name'].inside = typeInside;
    }

    p.languages.insertBefore('typescript', 'function', {
        decorator: {
            pattern: /@[$\w\xA0-\uFFFF]+/,
            inside: {
                at: {
                    pattern: /^@/,
                    alias: 'operator',
                },
                function: /^[\s\S]+/,
            },
        },
        'generic-function': {
            // e.g. foo<T extends "bar" | "baz">( ...
            pattern:
                /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
            greedy: true,
            inside: {
                function:
                    /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
                generic: {
                    pattern: /<[\s\S]+/, // everything after the first <
                    alias: 'class-name',
                    inside: typeInside,
                },
            },
        },
    });
};

// From https://github.com/PrismJS/prism/blob/master/components/prism-json.js
const addJsonLang = (prism: typeof Prism) => {
    prism.languages.json = {
        property: {
            pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
            lookbehind: true,
            greedy: true,
        },
        string: {
            pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
            lookbehind: true,
            greedy: true,
        },
        comment: {
            pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
            greedy: true,
        },
        number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
        punctuation: /[{}[\],]/,
        operator: /:/,
        boolean: /\b(?:false|true)\b/,
        null: {
            pattern: /\bnull\b/,
            alias: 'keyword',
        },
    };

    prism.languages.webmanifest = prism.languages.json;
};
