import { Html5Entities } from 'html_entities';

interface Options {
    /** Selector to `document.querySelector`. */
    scope?: string;
}

/** Fix typography in the node with selector `scope`. Currently only support text fixes: it
 * doesn't do any changes to the DOM. Code lifted and adjusted from the original `typeset`
 * module: https://github.com/davidmerfield/Typeset. */
export const typeset = ({ scope }: Options = {}) => {
    const modules: Module[] = [quotes, punctuation, spaces];

    return (site: Lume.Site) => {
        site.process(['.md'], (pages) => {
            for (const page of pages) {
                for (const mod of modules) {
                    if (page.document) {
                        transformTextNodes(
                            scope
                                ? (page.document.querySelector(scope) as HTMLElement | null)
                                : (page.document.body as unknown as HTMLElement | null),
                            mod,
                        );
                    }
                }
            }
        });
    };
};

type Module = (text: string, node: Node) => string;

// Better quotes.
// From https://github.com/davidmerfield/Typeset/blob/master/src/quotes.js
const quotes: Module = (text) => {
    text = text
        .replace(/(\W|^)"([^\s\!\?:;\.,‽»])/g, '$1\u201c$2') // beginning "
        .replace(/(\u201c[^"]*)"([^"]*$|[^\u201c"]*\u201c)/g, '$1\u201d$2') // ending "
        .replace(/([^0-9])"/g, '$1\u201d') // remaining " at end of word
        .replace(/(\W|^)'(\S)/g, '$1\u2018$2') // beginning '
        .replace(/([a-z])'([a-z])/gi, '$1\u2019$2') // conjunction's possession
        .replace(/((\u2018[^']*)|[a-z])'([^0-9]|$)/gi, '$1\u2019$3') // ending '
        .replace(/(\u2018)([0-9]{2}[^\u2019]*)(\u2018([^0-9]|$)|$|\u2019[a-z])/gi, '\u2019$2$3') // abbrev. years like '93
        .replace(
            /(\B|^)\u2018(?=([^\u2019]*\u2019\b)*([^\u2019\u2018]*\W[\u2019\u2018]\b|[^\u2019\u2018]*$))/gi,
            '$1\u2019',
        ) // backwards apostrophe
        .replace(/'''/g, '\u2034') // triple prime
        .replace(/("|'')/g, '\u2033') // double prime
        .replace(/'/g, '\u2032');

    // Allow escaped quotes
    text = text.replace(/\\“/, '"');
    text = text.replace(/\\”/, '"');
    text = text.replace(/\\’/, "'");
    text = text.replace(/\\‘/, "'");

    return text;
};

// Replaces wide spaces with hair spaces.
// From https://github.com/davidmerfield/Typeset/blob/master/src/spaces.js
const spaces: Module = (text) => {
    text = text.replace(/ × /g, ' × ');
    text = text.replace(/ \/ /g, ' / ');

    return text;
};

// From https://github.com/davidmerfield/Typeset/blob/master/src/punctuation.js
const punctuation: Module = (text) => {
    // M Dash
    // https://en.wikipedia.org/wiki/Dash
    text = text.replace(/--/g, '–');
    text = text.replace(/ – /g, Html5Entities.decode('&thinsp;&mdash;&thinsp;'));

    // Ellipsis
    // https://en.wikipedia.org/wiki/Ellipsis
    text = text.replace(/\.\.\./g, Html5Entities.decode('&hellip;'));

    // Non-breaking space
    // https://en.wikipedia.org/wiki/Non-breaking_space
    const NBSP = Html5Entities.decode('&nbsp;');
    const NBSP_PUNCTUATION_START = /([«¿¡]) /g;
    const NBSP_PUNCTUATION_END = / ([\!\?:;\.,‽»])/g;

    text = text.replace(NBSP_PUNCTUATION_START, '$1' + NBSP);
    text = text.replace(NBSP_PUNCTUATION_END, NBSP + '$1');

    return text;
};

// const mkSmallCaps = (): Module => {
// 	// Only numbers regex
// 	const onlyNumbers = new RegExp('^\\d+$');

// 	// Ensure the word has a length of more than 2 letters,
// 	// does not contain punctation since exterior punctuation
// 	// has been stripped by this point. If so, then see if the
// 	// uppercase version of the word is indentical, if so it's
// 	// very probably an acronym
// 	const isAcronym = (word: string) => (
// 		word.length &&
// 		word.trim().length > 1 &&
// 		!onlyNumbers.test(
// 			word.replace(/[\.,-\/#!–$%°\^&\*;?:+′|@\[\]{}=\-_`~()]/g, ''),
// 		) &&
// 		word.replace(/[\.,-\/#!$%\^&\*;–?:+|@\[\]{}=\-_`~(′°)]/g, '') === word &&
// 		word.toUpperCase() === word
// 	);

// 	const removeCruft = (word: string): [string, string, string] => {
// 		let ignore = '{}()-‘’[]!#$*&;:,.“”″′‘’"\''
// 			.split('')
// 			.concat(['&quot;', '\'s', '’s', '&#39;s']);
// 		const encodedIgnore = ignore.slice(0);

// 		for (const x in encodedIgnore) {
// 			encodedIgnore[x] = Html5Entities.encode(encodedIgnore[x]);
// 		}

// 		ignore = ignore.concat(encodedIgnore);

// 		let trailing = '';
// 		let leading = '';

// 		for (let i = 0; i < ignore.length; i++) {
// 			const ignoreThis = ignore[i];
// 			const endOfWord = word.slice(-ignoreThis.length);

// 			if (endOfWord === ignoreThis) {
// 				trailing = ignoreThis + trailing;
// 				word = word.slice(0, -ignoreThis.length);
// 				i = 0;
// 				continue;
// 			}
// 		}

// 		for (let j = 0; j < ignore.length; j++) {
// 			const ignoreThat = ignore[j];
// 			const startOfWord = word.slice(0, ignoreThat.length);

// 			if (startOfWord === ignoreThat) {
// 				leading += ignoreThat;
// 				word = word.slice(ignoreThat.length);
// 				j = 0;
// 				continue;
// 			}
// 		}

// 		return [leading, word, trailing];
// 	};

// 	return (text) => {
// 		const wordList = text.split(' ');

// 		for (const i in wordList) {
// 			const [leading, word, trailing] = removeCruft(wordList[i]);

// 			if (isAcronym(word)) {
// 				wordList[i] = leading + '<span class="small-caps">' + word + '</span>' + trailing;
// 			}
// 		}

// 		return wordList.join(' ');
// 	};
// };

// HELPERS

const IGNORE_NODES = ['code', 'pre', 'script', 'style'];

const transformTextNodes = (node: HTMLElement | null, transform: Module) => {
    if (!node) return;
    if (IGNORE_NODES.includes(node.nodeName.toLowerCase())) return;

    // Base case
    if (node.nodeType == node.TEXT_NODE) {
        if (!node.textContent?.trim()) return;
        let text = node.textContent;
        text = text.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        node.nodeValue = transform(text, node);
        return;
    }

    for (const c of node.childNodes) {
        transformTextNodes(c as HTMLElement, transform);
    }
};
