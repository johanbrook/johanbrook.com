import { prism as Prism } from '../../deps.ts';

export const prism = Prism;

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

export const loadLanguages = () => {
    addTsLang(prism);
    addJsonLang(prism);
    addJsxLang(prism);
    addTsxlang(prism);
};

export const prismMarkdown = (str: string, _lang: string): string => {
    if (_lang) {
        const [lang, lines] = _lang.split('/');

        const html = lang == 'text' || !prism.languages[lang]
            ? str
            : prism.highlight(str, prism.languages[lang], lang);

        const klass = `class="language-${lang}"`;

        const highlighted = lines ? highlightLines(lines.split(',')) : '';

        return /*html */ `<pre ${klass}><code ${klass}>${html}</code>${highlighted}</pre>`;
    }

    return '';
};

type Range = string | `${string}-${string}`;

const highlightLines = (ranges: Range[]): string => {
    return ranges
        .map((r) => {
            const [start, end] = r.split('-');

            const rows = end ? Math.abs(parseInt(end, 10) - parseInt(start, 10)) : 1;

            return /* html */ `<ins aria-hidden="true" style="--start: ${start}; --rows: ${rows}" class="line-highlight">${start}</ins>`;
        })
        .join('\n');
};

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
            /\btype\b(?=\s*(?:[\{*]|$))/,
        );
    }

    // doesn't work with TS because TS is too complex
    delete grammar['parameter'];
    delete grammar['literal-property'];

    // a version of typescript specifically for highlighting types
    const typeInside = p.languages.extend('typescript', {});
    delete typeInside['class-name'];

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
                function: /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
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

// From https://github.com/PrismJS/prism/blob/master/components/prism-jsx.js
const addJsxLang = (prism: typeof Prism) => {
    const javascript = prism.util.clone(prism.languages.javascript);

    const space = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source;
    const braces = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source;
    let spread = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;

    /**
     * @param {string} source
     * @param {string} [flags]
     */
    function re(source: string, flags?: string) {
        source = source
            .replace(/<S>/g, function () {
                return space;
            })
            .replace(/<BRACES>/g, function () {
                return braces;
            })
            .replace(/<SPREAD>/g, function () {
                return spread;
            });
        return RegExp(source, flags);
    }

    spread = re(spread).source;

    prism.languages.jsx = prism.languages.extend('markup', javascript);

    if (isTokenObject(prism.languages.jsx.tag)) {
        prism.languages.jsx.tag.pattern = re(
            /<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/
                .source,
        );

        // @ts-ignore I can't be bothered
        prism.languages.jsx.tag.inside['tag'].pattern = /^<\/?[^\s>\/]*/;
        // @ts-ignore I can't be bothered
        prism.languages.jsx.tag.inside['attr-value'].pattern =
            /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/;
        // @ts-ignore I can't be bothered
        prism.languages.jsx.tag.inside['tag'].inside['class-name'] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/;
        // @ts-ignore I can't be bothered
        prism.languages.jsx.tag.inside['comment'] = javascript['comment'];
    }

    prism.languages.insertBefore(
        'inside',
        'attr-name',
        {
            spread: {
                pattern: re(/<SPREAD>/.source),
                inside: prism.languages.jsx,
            },
        },
        // @ts-ignore I can't be bothered
        prism.languages.jsx.tag,
    );

    prism.languages.insertBefore(
        'inside',
        'special-attr',
        {
            // @ts-ignore I can't be bothered
            script: {
                // Allow for two levels of nesting
                pattern: re(/=<BRACES>/.source),
                alias: 'language-javascript',
                inside: {
                    'script-punctuation': {
                        pattern: /^=(?=\{)/,
                        alias: 'punctuation',
                    },

                    rest: prism.languages.jsx,
                },
            },
        },
        prism.languages.jsx.tag,
    );

    // The following will handle plain text inside tags
    const stringifyToken = function (token: any) {
        if (!token) {
            return '';
        }
        if (typeof token === 'string') {
            return token;
        }
        if (typeof token.content === 'string') {
            return token.content;
        }
        return token.content.map(stringifyToken).join('');
    };

    const walkTokens = function (tokens: any[]) {
        const openedTags = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            let notTagNorBrace = false;

            if (typeof token !== 'string') {
                if (
                    token.type === 'tag' &&
                    token.content[0] &&
                    token.content[0].type === 'tag'
                ) {
                    // We found a tag, now find its kind

                    if (token.content[0].content[0].content === '</') {
                        // Closing tag
                        if (
                            openedTags.length > 0 &&
                            openedTags[openedTags.length - 1].tagName ===
                                stringifyToken(token.content[0].content[1])
                        ) {
                            // Pop matching opening tag
                            openedTags.pop();
                        }
                    } else {
                        if (
                            token.content[token.content.length - 1].content ===
                                '/>'
                        ) {
                            // Autoclosed tag, ignore
                        } else {
                            // Opening tag
                            openedTags.push({
                                tagName: stringifyToken(
                                    token.content[0].content[1],
                                ),
                                openedBraces: 0,
                            });
                        }
                    }
                } else if (
                    openedTags.length > 0 &&
                    token.type === 'punctuation' &&
                    token.content === '{'
                ) {
                    // Here we might have entered a JSX context inside a tag
                    openedTags[openedTags.length - 1].openedBraces++;
                } else if (
                    openedTags.length > 0 &&
                    openedTags[openedTags.length - 1].openedBraces > 0 &&
                    token.type === 'punctuation' &&
                    token.content === '}'
                ) {
                    // Here we might have left a JSX context inside a tag
                    openedTags[openedTags.length - 1].openedBraces--;
                } else {
                    notTagNorBrace = true;
                }
            }
            if (notTagNorBrace || typeof token === 'string') {
                if (
                    openedTags.length > 0 &&
                    openedTags[openedTags.length - 1].openedBraces === 0
                ) {
                    // Here we are inside a tag, and not inside a JSX context.
                    // That's plain text: drop any tokens matched.
                    let plainText = stringifyToken(token);

                    // And merge text with adjacent text
                    if (
                        i < tokens.length - 1 &&
                        (typeof tokens[i + 1] === 'string' ||
                            tokens[i + 1].type === 'plain-text')
                    ) {
                        plainText += stringifyToken(tokens[i + 1]);
                        tokens.splice(i + 1, 1);
                    }
                    if (
                        i > 0 &&
                        (typeof tokens[i - 1] === 'string' ||
                            tokens[i - 1].type === 'plain-text')
                    ) {
                        plainText = stringifyToken(tokens[i - 1]) + plainText;
                        tokens.splice(i - 1, 1);
                        i--;
                    }

                    tokens[i] = new prism.Token(
                        'plain-text',
                        plainText,
                        // @ts-ignore I can't be bothered
                        null,
                        plainText,
                    );
                }
            }

            if (token.content && typeof token.content !== 'string') {
                walkTokens(token.content);
            }
        }
    };

    prism.hooks.add('after-tokenize', function (env) {
        if (env.language !== 'jsx' && env.language !== 'tsx') {
            return;
        }
        walkTokens(env.tokens);
    });
};

const addTsxlang = (prism: typeof Prism) => {
    const typescript = prism.util.clone(Prism.languages.typescript);
    prism.languages.tsx = prism.languages.extend('jsx', typescript);

    // doesn't work with TS because TS is too complex
    delete prism.languages.tsx['parameter'];
    delete prism.languages.tsx['literal-property'];

    // This will prevent collisions between TSX tags and TS generic types.
    // Idea by https://github.com/karlhorky
    // Discussion: https://github.com/PrismJS/prism/issues/2594#issuecomment-710666928
    const tag = prism.languages.tsx.tag;

    if (isTokenObject(tag)) {
        tag.pattern = RegExp(
            /(^|[^\w$]|(?=<\/))/.source + '(?:' + tag.pattern.source + ')',
            tag.pattern.flags,
        );
        tag.lookbehind = true;
    }
};

const isTokenObject = (t: any): t is Prism.TokenObject => !!t.inside && !!t.pattern;
