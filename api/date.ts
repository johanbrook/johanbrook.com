import { DateTimeFormatterTemporal } from './vendor/datetime-format-temporal.ts';

// => 'yyyy-MM-dd HH:mm:ss'
// fileName: true => 'yyyy-MM-dd-HH-mm-ss'
export const formatDate = (date: Date, fileName = false) => {
    const datePart = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
        .map((n) => String(n).padStart(2, '0'))
        .join('-');

    const timePart = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .filter(Boolean)
        .map((n) => String(n).padStart(2, '0'))
        .join(fileName ? '-' : ':');

    if (fileName) {
        return datePart + '-' + timePart;
    }

    return datePart + ' ' + timePart;
};

// Temporal proposal doesn't include nice strftime stuff yet:
// https://github.com/js-temporal/proposal-temporal-v2/issues/5
// This function only supports "simple" formats, like `yyyy-MM-dd HH:mm:ss`
export const formatTemporalDate = (thing: Temporal.PlainDateTimeLike, format: string): string => {
    const formatter = new DateTimeFormatterTemporal(format);
    return formatter.format(thing);
};

export const safeTemporalZonedDateTime = (str: string): Temporal.ZonedDateTime | null => {
    try {
        return Temporal.ZonedDateTime.from(str);
    } catch (err) {
        if (err instanceof RangeError) return null;

        throw err; // Other random error
    }
};

declare global {
    namespace Temporal {
        interface ZonedDateTime {
            timeZone: Temporal.TimeZone;
        }
    }
}
