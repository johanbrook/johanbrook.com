const excerptMinimumLength = 140;
const excerptSeparator = '<!--more-->';

export const extractExcerpt = (content: string): string => {
    content = content.trim();

    if (!content) return '';

    if (content.includes(excerptSeparator)) {
        return content.substring(0, content.indexOf(excerptSeparator)).trim();
    } else if (content.length <= excerptMinimumLength) {
        return content;
    }
    const excerptEnd = findExcerptEnd(content);

    return content.substring(0, excerptEnd).trim();
};

const findExcerptEnd = (content: string, skipLength = 0): number => {
    if (content == '') {
        return 0;
    }

    const paragraphEnd = content.indexOf('\n\n', skipLength);

    if (paragraphEnd == -1) {
        return content.length;
    }

    if (paragraphEnd < excerptMinimumLength) {
        return (
            paragraphEnd +
            findExcerptEnd(content.substring(paragraphEnd), paragraphEnd)
        );
    }

    return paragraphEnd;
};
