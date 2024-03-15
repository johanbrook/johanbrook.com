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

/** Formats into `2024-03-15T10:24:35+01:00`. */
export const formatISO = (d: Temporal.ZonedDateTime): string =>
    d.toString({
        timeZoneName: 'never',
        smallestUnit: 'seconds',
    });

/** Format appropriate for file name: `2024-03-15-10-24-35`. */
export const formatFileName = (d: Temporal.ZonedDateTime): string =>
    d.toString({
        timeZoneName: 'never',
        smallestUnit: 'seconds',
        offset: 'never',
    })
        .replace('T', '-')
        .replaceAll(':', '-');

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
