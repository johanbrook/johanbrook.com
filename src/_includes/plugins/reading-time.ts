import type { Page } from 'lume/core.ts';

export const readingTime = (
    pageOrContent: Page | string,
    { printSeconds = false, raw = false, speed = 300 } = {}
) => {
    const htmlContent: string =
        typeof pageOrContent == 'string'
            ? pageOrContent
            : (pageOrContent as any).data.content;

    if (typeof htmlContent != 'string') {
        return `0 ${printSeconds ? 'seconds' : 'minutes'}`;
    }

    const content = htmlContent.replace(/(<([^>]+)>)/gi, '');
    const matches = content.match(/[\u0400-\u04FF]+|\S+\s*/g);
    const count = matches !== null ? matches.length : 0;

    let est = '';

    if (printSeconds) {
        const min = Math.floor(count / speed);
        const sec = Math.floor((count % speed) / (speed / 60));

        if (!raw) {
            const mins = min + ' minute' + (min === 1 ? '' : 's') + ', ';
            const secs = sec + ' second' + (sec === 1 ? '' : 's');
            est = min > 0 ? mins + secs : secs;
        } else {
            est = String(min * 60 + sec);
        }
    } else {
        const min = Math.ceil(count / speed);

        if (!raw) {
            est = min + ' min';
        } else {
            est = String(min);
        }
    }

    return est;
};
