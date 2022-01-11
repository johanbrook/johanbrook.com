import { DateTimeFormatter } from '../deps.ts';

export const formatDate = (date, formatString) => {
    const formatter = new DateTimeFormatter(formatString);
    return formatter.format(date, {
        timeZone: 'UTC',
    });
};
