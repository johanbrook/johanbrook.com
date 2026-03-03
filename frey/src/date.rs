use jiff::{Timestamp, Zoned, civil};
use std::{fmt, str::FromStr, time::SystemTime};

#[derive(Debug)]
enum DateTimeFormat {
    /// 2024-02-19T13:39:53+01:00 (ISO 8601)
    Machine,
    /// 2024-02-19
    Date,
    /// 13:39
    Time,
    /// February 19, 2024
    HumanDate,
    /// February 19, 2024 — 13:39
    HumanTime,
    /// Friday, 1 March 2024 at 15:13:02 Indochina Time
    Detailed,
    /// October 2010
    MonthYear,
}

#[derive(Debug)]
pub enum Error {
    ParseDateTimeFormat(String),
    ParseDate(String, jiff::Error),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::ParseDateTimeFormat(s) => write!(f, "Couldn't parse ParseDateTimeFormat: {s}"),
            Error::ParseDate(s, e) => write!(f, "Couldn't parse date {s}: {e}"),
        }
    }
}

impl std::error::Error for Error {}

impl FromStr for DateTimeFormat {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Machine" | "iso8601" => Ok(Self::Machine),
            "Date" | "yyyy-MM-dd" => Ok(Self::Date),
            "Time" | "HH:mm" => Ok(Self::Time),
            "HumanDate" | "MMMM d, yyyy" => Ok(Self::HumanDate),
            "HumanTime" => Ok(Self::HumanTime),
            "Detailed" => Ok(Self::Detailed),
            "MonthYear" | "MMMM yyyy" => Ok(Self::MonthYear),
            _ => Err(Error::ParseDateTimeFormat(s.to_owned())),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Date {
    /// A date with a timezone.
    Zoned(Zoned),
    /// A date with a time and unknown timezone.
    Datetime(Timestamp),
    /// A plain date without time.
    Date(civil::Date),
}

impl Date {
    pub fn from_file(t: SystemTime) -> Self {
        let dur = t
            .duration_since(std::time::UNIX_EPOCH)
            .expect("Failed to use system time");
        let secs = dur.as_secs() as i64;
        let dt = Timestamp::new(secs, 0).expect("Failed to construct timestamp from system time");

        Self::Datetime(dt)
    }
}

impl FromStr for Date {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        parse_date(s)
    }
}

impl Default for Date {
    fn default() -> Self {
        let dt = Timestamp::UNIX_EPOCH;
        Self::Datetime(dt)
    }
}

impl fmt::Display for Date {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let fmt = DateTimeFormat::Machine;
        write!(f, "{}", format_date(self, fmt))
    }
}

fn parse_date(input: &str) -> Result<Date, Error> {
    input
        .parse::<Zoned>()
        .map(Date::Zoned)
        .or_else(|_| input.parse::<Timestamp>().map(Date::Datetime))
        .or_else(|_| input.parse::<civil::Date>().map(Date::Date))
        .map_err(|e| Error::ParseDate(input.to_owned(), e))
}

fn format_date(date: &Date, fmt: DateTimeFormat) -> String {
    match date {
        Date::Zoned(zdt) => {
            let fmt_str = match fmt {
                DateTimeFormat::Machine => "%Y-%m-%dT%H:%M:%S%:z",
                DateTimeFormat::Date => "%Y-%m-%d",
                DateTimeFormat::Time => "%H:%M",
                DateTimeFormat::HumanDate => "%B %-d, %Y",
                DateTimeFormat::HumanTime => "%B %-d, %Y \u{2014} %H:%M",
                DateTimeFormat::Detailed => "%A, %-d %B %Y at %H:%M:%S %Q",
                DateTimeFormat::MonthYear => "%B %Y",
            };
            zdt.strftime(fmt_str).to_string()
        }
        Date::Datetime(ts) => {
            let fmt_str = match fmt {
                DateTimeFormat::Machine => "%Y-%m-%dT%H:%M:%S%:z",
                DateTimeFormat::Date => "%Y-%m-%d",
                DateTimeFormat::Time => "%H:%M",
                DateTimeFormat::HumanDate => "%B %-d, %Y",
                DateTimeFormat::HumanTime => "%B %-d, %Y \u{2014} %H:%M",
                DateTimeFormat::Detailed => "%A, %-d %B %Y at %H:%M:%S",
                DateTimeFormat::MonthYear => "%B %Y",
            };
            ts.strftime(fmt_str).to_string()
        }
        Date::Date(dt) => {
            // civil::Date has no time components, so handle time-dependent
            // formats specially.
            match fmt {
                DateTimeFormat::Machine => dt.strftime("%Y-%m-%dT00:00:00").to_string(),
                DateTimeFormat::Date => dt.strftime("%Y-%m-%d").to_string(),
                DateTimeFormat::Time => "00:00".to_string(),
                DateTimeFormat::HumanDate => dt.strftime("%B %-d, %Y").to_string(),
                DateTimeFormat::HumanTime => {
                    format!("{} \u{2014} 00:00", dt.strftime("%B %-d, %Y"))
                }
                DateTimeFormat::Detailed => dt.strftime("%A, %-d %B %Y").to_string(),
                DateTimeFormat::MonthYear => dt.strftime("%B %Y").to_string(),
            }
        }
    }
}

/// Template filter: `date(input, format)`.
///
/// Parses `input` as a date string (RFC 9557 zoned or plain YYYY-MM-DD) and
/// formats it according to `format` (one of: Machine, Date, Time, HumanDate,
/// HumanTime, Detailed, MonthYear).
pub fn date(input: &str, format: &str) -> String {
    let fmt: DateTimeFormat = format.parse().expect("unknown date format");
    let date = parse_date(input).expect("could not parse date");
    format_date(&date, fmt)
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- Plain date tests ---

    #[test]
    fn plain_date_human_date() {
        assert_eq!(date("2022-02-23", "HumanDate"), "February 23, 2022");
    }

    #[test]
    fn plain_date_date() {
        assert_eq!(date("2022-02-23", "Date"), "2022-02-23");
    }

    #[test]
    fn plain_date_time() {
        assert_eq!(date("2022-02-23", "Time"), "00:00");
    }

    #[test]
    fn plain_date_machine() {
        assert_eq!(date("2022-02-23", "Machine"), "2022-02-23T00:00:00");
    }

    #[test]
    fn plain_date_human_time() {
        assert_eq!(
            date("2022-02-23", "HumanTime"),
            "February 23, 2022 \u{2014} 00:00"
        );
    }

    #[test]
    fn plain_date_month_year() {
        assert_eq!(date("2022-02-23", "MonthYear"), "February 2022");
    }

    #[test]
    fn plain_date_detailed() {
        let result = date("2024-03-01", "Detailed");
        assert_eq!(result, "Friday, 1 March 2024");
    }

    // --- Zoned date tests ---

    #[test]
    fn zoned_human_date() {
        assert_eq!(
            date("2026-02-19T08:00:38+01:00[Europe/Stockholm]", "HumanDate"),
            "February 19, 2026"
        );
    }

    #[test]
    fn zoned_date() {
        assert_eq!(
            date("2026-02-19T08:00:38+01:00[Europe/Stockholm]", "Date"),
            "2026-02-19"
        );
    }

    #[test]
    fn zoned_time() {
        assert_eq!(
            date("2026-02-19T08:00:38+01:00[Europe/Stockholm]", "Time"),
            "08:00"
        );
    }

    #[test]
    fn zoned_human_time() {
        assert_eq!(
            date("2026-02-19T08:00:38+01:00[Europe/Stockholm]", "HumanTime"),
            "February 19, 2026 \u{2014} 08:00"
        );
    }

    #[test]
    fn zoned_detailed() {
        let result = date("2024-03-01T15:13:02+01:00[Europe/Stockholm]", "Detailed");
        assert_eq!(result, "Friday, 1 March 2024 at 15:13:02 Europe/Stockholm");
    }

    #[test]
    fn zoned_machine() {
        let result = date("2026-02-19T08:00:38+01:00[Europe/Stockholm]", "Machine");
        // Should have offset but no bracket annotation
        assert!(result.contains("+01:00"));
        assert!(!result.contains('['));
    }

    #[test]
    fn zoned_month_year() {
        assert_eq!(
            date("2026-02-19T08:00:38+01:00[Europe/Stockholm]", "MonthYear"),
            "February 2026"
        );
    }

    // --- PlainDateTime fallback ---

    #[test]
    fn plain_datetime_human_date() {
        assert_eq!(date("2024-03-15T10:30:00", "HumanDate"), "March 15, 2024");
    }
}
