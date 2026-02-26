use rquickjs::{Context, Function, Runtime, function::Opt};

pub struct Engine {
    runtime: Runtime,
}

impl Engine {
    pub fn new() -> Result<Self, rquickjs::Error> {
        let runtime = Runtime::new()?;
        Ok(Self { runtime })
    }

    pub fn eval(
        &self,
        js_code: &str,
        data: &serde_json::Value,
        location: &str,
    ) -> Result<String, rquickjs::Error> {
        let context = Context::full(&self.runtime)?;

        context.with(|ctx| {
            // Inject data as global variables
            let globals = ctx.globals();

            if let serde_json::Value::Object(map) = data {
                for (key, value) in map {
                    let js_val: rquickjs::Value = ctx.json_parse(value.to_string())?;
                    globals.set(key.as_str(), js_val)?;
                }
            }

            // Register built-in filter functions on __filters namespace
            let filters = rquickjs::Object::new(ctx.clone())?;
            register_builtins(&ctx, &filters, location)?;
            globals.set("__filters", filters)?;

            // Evaluate the compiled template JS
            let result: rquickjs::Value = match ctx.eval(js_code) {
                Ok(v) => v,
                Err(rquickjs::Error::Exception) => {
                    let exception = ctx.catch();
                    let msg = exception
                        .as_exception()
                        .map(|e| e.to_string())
                        .unwrap_or_else(|| format!("{exception:?}"));
                    return Err(rquickjs::Error::Io(std::io::Error::other(msg)));
                }
                Err(e) => return Err(e),
            };

            // Convert result to string
            match result.as_string() {
                Some(s) => Ok(s.to_string()?),
                None => {
                    // For non-string values, stringify via JSON or coerce
                    let json = ctx.json_stringify(&result)?;
                    match json {
                        Some(s) => Ok(s.to_string()?),
                        None => Ok(String::new()),
                    }
                }
            }
        })
    }
}

fn register_builtins<'js>(
    ctx: &rquickjs::Ctx<'js>,
    globals: &rquickjs::Object<'js>,
    location: &str,
) -> Result<(), rquickjs::Error> {
    // Vento built-in filters: escape, unescape, empty, safe

    globals.set(
        "escape",
        Function::new(ctx.clone(), |s: String| {
            s.replace('&', "&amp;")
                .replace('<', "&lt;")
                .replace('>', "&gt;")
                .replace('"', "&quot;")
                .replace('\'', "&#x27;")
        })?,
    )?;

    globals.set(
        "unescape",
        Function::new(ctx.clone(), |s: String| {
            s.replace("&#x27;", "'")
                .replace("&quot;", "\"")
                .replace("&gt;", ">")
                .replace("&lt;", "<")
                .replace("&amp;", "&")
        })?,
    )?;

    globals.set(
        "empty",
        Function::new(ctx.clone(), |val: rquickjs::Value<'_>| {
            if val.is_undefined() || val.is_null() {
                return true;
            }
            if let Some(b) = val.as_bool() {
                return !b;
            }
            if let Some(s) = val.as_string()
                && let Ok(s) = s.to_string()
            {
                return s.trim().is_empty();
            }
            if let Some(arr) = val.as_array() {
                return arr.is_empty();
            }
            false
        })?,
    )?;

    // safe: identity function (passthrough). Useful when autoescaping is on
    // to mark content as trusted.
    globals.set("safe", Function::new(ctx.clone(), |s: String| s)?)?;

    // url: prepend the site location to a path
    let loc = location.trim_end_matches('/').to_string();
    globals.set(
        "url",
        Function::new(ctx.clone(), move |path: String, _absolute: Opt<bool>| {
            format!("{}{}", loc, path)
        })?,
    )?;

    // md: render Markdown to HTML. md(text) wraps in <p>, md(text, true) strips the outer <p>.
    globals.set(
        "md",
        Function::new(ctx.clone(), |text: rquickjs::Value<'_>, inline: Opt<bool>| {
            let text = match text.as_string().and_then(|s| s.to_string().ok()) {
                Some(s) => s,
                None => return String::new(),
            };

            let opts = markdown::Options {
                compile: markdown::CompileOptions {
                    allow_dangerous_html: true,
                    ..markdown::CompileOptions::gfm()
                },
                ..markdown::Options::gfm()
            };
            let html =
                markdown::to_html_with_options(&text, &opts).unwrap_or_else(|_| text.clone());

            let is_inline = inline.0.unwrap_or(false);
            if is_inline {
                // Strip wrapping <p>...</p> for inline use
                let trimmed = html.trim();
                trimmed
                    .strip_prefix("<p>")
                    .and_then(|s| s.strip_suffix("</p>"))
                    .unwrap_or(trimmed)
                    .to_string()
            } else {
                html
            }
        })?,
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eval_simple() {
        let engine = Engine::new().unwrap();
        let data = serde_json::json!({"name": "world"});
        let result = engine
            .eval(
                r#"let __out = ""; __out += "Hello "; __out += (name); __out;"#,
                &data,
                "http://localhost:3000",
            )
            .unwrap();
        assert_eq!(result, "Hello world");
    }

    #[test]
    fn eval_unescape() {
        let engine = Engine::new().unwrap();
        let data = serde_json::json!({"html": "&lt;b&gt;bold&lt;/b&gt;"});
        let result = engine
            .eval(
                r#"let __out = ""; __out += __filters.unescape(html); __out;"#,
                &data,
                "http://localhost:3000",
            )
            .unwrap();
        assert_eq!(result, "<b>bold</b>");
    }

    #[test]
    fn eval_empty() {
        let engine = Engine::new().unwrap();
        let data = serde_json::json!({"a": "", "b": "hello", "c": [], "d": [1]});
        let result = engine
            .eval(
                r#"let __out = ""; __out += __filters.empty(a) + "," + __filters.empty(b) + "," + __filters.empty(c) + "," + __filters.empty(d); __out;"#,
                &data,
                "http://localhost:3000",
            )
            .unwrap();
        assert_eq!(result, "true,false,true,false");
    }

    #[test]
    fn eval_for_loop() {
        let engine = Engine::new().unwrap();
        let data = serde_json::json!({"items": ["a", "b", "c"]});
        let result = engine
            .eval(
                r#"let __out = ""; for (const x of items) { __out += x; } __out;"#,
                &data,
                "http://localhost:3000",
            )
            .unwrap();
        assert_eq!(result, "abc");
    }

    #[test]
    fn eval_escape_html() {
        let engine = Engine::new().unwrap();
        let data = serde_json::json!({"html": "<b>bold</b>"});
        let result = engine
            .eval(
                r#"let __out = ""; __out += __filters.escape(html); __out;"#,
                &data,
                "http://localhost:3000",
            )
            .unwrap();
        assert_eq!(result, "&lt;b&gt;bold&lt;/b&gt;");
    }
}
