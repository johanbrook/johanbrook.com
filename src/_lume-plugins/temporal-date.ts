// Needs deno run --unstable-temporal at the time of writing.
interface Options {
    name?: string;
}

export default function (options: Options = {}): Lume.Plugin {
    const { name = 'tdate' } = options;

    // Intentional `function` for use of `this`
    const temporalDate: TemporalDate = function (dateLike, format, overrideTimezone) {
        if (!dateLike) return;

        if (!format) {
            throw new Error(`Needs "format" parameter, got: ${format}`);
        }

        const timezone = timezoneOf(overrideTimezone, this.data.timezone);

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
    /** 2024-02-19T13:39:53+01:00 (ISO 8601) */
    Machine = 'Machine',
    /** 2024-02-19 */
    Date = 'Date',
    /** February 19, 2024 */
    HumanDate = 'HumanDate',
    /** February 19, 2024 — 13:39 */
    HumanTime = 'HumanTime',
    /** Friday, 1 March 2024 at 15:13:02 Indochina Time */
    Detailed = 'Detailed',
    /** October 2010 */
    MonthYear = 'MonthYear',
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

const formattedOf = (
    date: Temporal.ZonedDateTime,
    format: DateTimeFormat,
    now: Temporal.ZonedDateTime,
): string => {
    switch (format) {
        case DateTimeFormat.Machine: {
            return date.toString({ smallestUnit: 'second', timeZoneName: 'never' });
        }
        case DateTimeFormat.HumanTime: {
            const includeYear = date.year != now.year;
            // Sigh. Need to explicitly pass on timezone to the formatter:
            // https://github.com/tc39/proposal-temporal/issues/2013
            const formatter = new Intl.DateTimeFormat(undefined, {
                ...DATE_FORMAT,
                timeZone: date.timeZone.toString(),
            });
            const { month, day, hour, minute, year } = commonPartsOf(formatter.formatToParts(date));

            return `${month} ${day}%YEAR% — ${hour}:${minute}`.replace(
                '%YEAR%',
                includeYear ? `, ${year}` : '',
            );
        }
        case DateTimeFormat.HumanDate: {
            const includeYear = date.year != now.year;
            const formatter = new Intl.DateTimeFormat(undefined, {
                ...DATE_FORMAT,
                timeZone: date.timeZone.toString(),
            });
            const { month, day, year } = commonPartsOf(formatter.formatToParts(date));

            return `${month} ${day}${includeYear ? `, ${year}` : ''}`;
        }
        case DateTimeFormat.Detailed: {
            return date.toLocaleString('en-GB', {
                timeZone: date.timeZone.toString(), // aaaahhh still need to provide this manually :X
                timeZoneName: 'longGeneric',
                weekday: 'long',
                month: 'long',
            });
        }
        case DateTimeFormat.MonthYear: {
            const formatter = new Intl.DateTimeFormat(undefined, {
                ...DATE_FORMAT,
                timeZone: date.timeZone.toString(),
            });
            const { month, year } = commonPartsOf(formatter.formatToParts(date));
            return `${month} ${year}`;
        }
        case DateTimeFormat.Date: {
            return date.toPlainDate().toString();
        }
        default:
            throw new Error(`${format} not implemented!`);
    }
};

const timezoneOf = (...strings: Array<string | undefined>) => {
    const safeParse = (str: string): Temporal.TimeZone | null => {
        try {
            return Temporal.TimeZone.from(str) as Temporal.TimeZone;
        } catch {
            return null;
        }
    };

    for (const str of strings) {
        if (!str) continue;

        const res = safeParse(str);

        if (!res) {
            console.warn(`timezoneOf: Couldn't parse timezone: ${str}. Falling back to next`);
            continue;
        }

        return res;
    }

    console.warn(
        `timezoneOf: Last fallback in timezone to current machine setting! Something is probably wrong`,
    );

    return (Temporal.Now as any).timeZone() as Temporal.TimeZone;
};

const commonPartsOf = (
    parts: Intl.DateTimeFormatPart[],
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

interface Context {
    data: Lume.Data & { timezone: string };
}

type TemporalDate = (
    this: Context | void,
    dateLike: string | Date,
    format: DateTimeFormat,
    tz?: string,
) => string | undefined;

declare global {
    interface Date {
        toTemporalInstant(): Temporal.Instant;
    }
}

declare global {
    namespace Temporal {
        interface ZonedDateTime {
            timeZone: Temporal.TimeZone;
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
