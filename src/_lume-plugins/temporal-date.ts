// Needs deno run --unstable-temporal at the time of writing.
interface Options {
    name?: string;
    fallbackTimeZone: Temporal.TimeZone;
}

export default function (options: Options): Lume.Plugin {
    const { name = 'tdate', fallbackTimeZone } = options;

    const temporalDate: TemporalDate = (dateLike, format, tz) => {
        if (!dateLike) return;

        if (!format) {
            throw new Error(`Needs "format" parameter, got: ${format}`);
        }

        const timezone = tz ? (Temporal.TimeZone.from(tz) as Temporal.TimeZone) : fallbackTimeZone;

        const date = ((): Temporal.ZonedDateTime => {
            if (dateLike == 'now') return Temporal.Now.zonedDateTimeISO(timezone);

            if (dateLike instanceof Date) {
                return dateLike.toTemporalInstant().toZonedDateTimeISO(timezone);
            }

            return Temporal.PlainDateTime.from(dateLike).toZonedDateTime(timezone);
        })();

        const now = Temporal.Now.zonedDateTimeISO(timezone);
        const res = formattedOf(date, format, now);

        return res;
    };

    return (site) => {
        site.filter(name, temporalDate);
    };
}

enum DateTimeFormat {
    /** 2024-02-19T13:39:53Z */
    Machine = 'Machine',
    /** 2024-02-19 */
    Date = 'Date',
    /** February 19th, 2024 */
    HumanDate = 'HumanDate',
    /** February 19th, 2024 — 13:39 */
    HumanTime = 'HumanTime',
    /** February 19th, 2024 at 1:39:53 PM GMT+0 */
    Detailed = 'Detailed',
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
};

const formattedOf = (date: Temporal.ZonedDateTime, format: DateTimeFormat, now: Temporal.ZonedDateTime): string => {
    switch (format) {
        case DateTimeFormat.HumanTime: {
            const includeYear = date.year != now.year;
            // Sigh. Need to explicitly pass on timezone to the formatter:
            // https://github.com/tc39/proposal-temporal/issues/2013
            const formatter = new Intl.DateTimeFormat(undefined, { ...DATE_FORMAT, timeZone: date.timeZone });
            const parts = commonPartsOf(formatter.formatToParts(date));

            return `${parts.month} ${parts.day}%YEAR% — ${parts.hour}:${parts.minute}`.replace(
                '%YEAR%',
                includeYear ? `, ${parts.year}` : ''
            );
        }
        default:
            throw new Error('Not implemented');
    }
};

const commonPartsOf = (
    parts: Intl.DateTimeFormatPart[]
): Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string> => {
    const out = {} as any;

    for (const part of parts) {
        switch (part.type) {
            case 'year':
            case 'month':
            case 'day':
            case 'hour':
            case 'minute':
            case 'second':
                out[part.type] = part.value;
                continue;
        }
    }

    return out;
};

type TemporalDate = (dateLike: string | Date, format: DateTimeFormat, tz?: string) => string | undefined;

declare global {
    interface Date {
        toTemporalInstant(): Temporal.Instant;
    }
}

declare global {
    namespace Temporal {
        interface ZonedDateTime {
            timeZone: string;
        }
    }
}

/** Extends Helpers interface */
declare global {
    namespace Lume {
        export interface Helpers {
            tdate: TemporalDate;
        }
    }
}
