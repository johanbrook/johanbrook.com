use rquickjs::{Context, Function, Module, Runtime, function::Opt};

/// Result of evaluating a JS data file.
pub struct JsDataResult {
    pub values: serde_json::Value,
    pub has_functions: bool,
}

/// Evaluate a JS file as an ES module and return its exports as a JSON value.
///
/// Function-valued exports are skipped in the `values` field (not serializable),
/// but `has_functions` is set to `true` so the caller can store the raw source
/// for later evaluation in the template context.
/// The `default` export, if an object, is merged into the top-level result map.
/// Named exports become top-level keys.
pub fn eval_js_data(source: &str) -> Result<JsDataResult, rquickjs::Error> {
    let runtime = Runtime::new()?;
    let context = Context::full(&runtime)?;

    context.with(|ctx| {
        let declared = match Module::declare(ctx.clone(), "data", source) {
            Ok(m) => m,
            Err(rquickjs::Error::Exception) => return Err(catch_exception(&ctx)),
            Err(e) => return Err(e),
        };
        let (module, promise) = match declared.eval() {
            Ok(r) => r,
            Err(rquickjs::Error::Exception) => return Err(catch_exception(&ctx)),
            Err(e) => return Err(e),
        };
        if let Err(rquickjs::Error::Exception) = promise.finish::<()>() {
            return Err(catch_exception(&ctx));
        }

        let namespace = module.namespace()?;
        let mut result = serde_json::Map::new();
        let mut has_functions = false;

        for key in namespace.keys::<String>() {
            let key = key?;
            let val: rquickjs::Value = namespace.get(&key)?;

            // Skip function exports (not serializable)
            if val.is_function() {
                has_functions = true;
                continue;
            }

            if key == "default" {
                // Merge default export's keys into top-level
                if let Some(json_str) = ctx.json_stringify(&val)? {
                    let s = json_str.to_string()?;
                    if let Ok(serde_json::Value::Object(map)) = serde_json::from_str(&s) {
                        result.extend(map);
                    }
                }
            } else {
                // Named export → insert as result[key]
                if let Some(json_str) = ctx.json_stringify(&val)? {
                    let s = json_str.to_string()?;
                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&s) {
                        result.insert(key, value);
                    }
                }
            }
        }

        Ok(JsDataResult {
            values: serde_json::Value::Object(result),
            has_functions,
        })
    })
}

/// Call a named JS function exported from one of the given JS module sources.
///
/// Evaluates `js_sources` as ES modules, promotes their named exports to globals,
/// then checks if `fn_name` exists as a function. If so, calls it with `args_json`
/// (a JSON-encoded argument) and returns the result as a `serde_json::Value`.
/// Returns `Ok(None)` if the export exists but isn't a function, or doesn't exist.
pub fn call_js_function(
    js_sources: &[String],
    fn_name: &str,
    args_json: &str,
) -> Result<Option<serde_json::Value>, rquickjs::Error> {
    let runtime = Runtime::new()?;
    let context = Context::full(&runtime)?;

    context.with(|ctx| {
        let globals = ctx.globals();

        // Evaluate each JS source module and promote exports to globals
        for (i, source) in js_sources.iter().enumerate() {
            let mod_name = format!("__call_{i}");
            let declared = match Module::declare(ctx.clone(), mod_name, source.as_str()) {
                Ok(m) => m,
                Err(rquickjs::Error::Exception) => return Err(catch_exception(&ctx)),
                Err(e) => return Err(e),
            };
            let (module, promise) = match declared.eval() {
                Ok(r) => r,
                Err(rquickjs::Error::Exception) => return Err(catch_exception(&ctx)),
                Err(e) => return Err(e),
            };
            if let Err(rquickjs::Error::Exception) = promise.finish::<()>() {
                return Err(catch_exception(&ctx));
            }
            let namespace = module.namespace()?;
            for key in namespace.keys::<String>() {
                let key = key?;
                if key == "default" {
                    continue;
                }
                let val: rquickjs::Value = namespace.get(&key)?;
                globals.set(key.as_str(), val)?;
            }
        }

        // Check if fn_name is a function
        let func: rquickjs::Value = globals.get(fn_name)?;
        if !func.is_function() {
            return Ok(None);
        }

        // Parse the args JSON and call the function
        let arg: rquickjs::Value = ctx.json_parse(args_json)?;
        let func = func.into_function().unwrap();
        let result: rquickjs::Value = match func.call((arg,)) {
            Ok(v) => v,
            Err(rquickjs::Error::Exception) => return Err(catch_exception(&ctx)),
            Err(e) => return Err(e),
        };

        // Convert result to serde_json::Value
        if result.is_bool() {
            let b: bool = result.get()?;
            Ok(Some(serde_json::Value::Bool(b)))
        } else if let Some(json_str) = ctx.json_stringify(&result)? {
            let s = json_str.to_string()?;
            match serde_json::from_str::<serde_json::Value>(&s) {
                Ok(v) => Ok(Some(v)),
                Err(_) => Ok(Some(serde_json::Value::String(s))),
            }
        } else {
            Ok(None)
        }
    })
}

fn catch_exception(ctx: &rquickjs::Ctx<'_>) -> rquickjs::Error {
    let exception = ctx.catch();
    let msg = exception
        .as_exception()
        .map(|e| e.to_string())
        .unwrap_or_else(|| format!("{exception:?}"));
    rquickjs::Error::Io(std::io::Error::other(msg))
}

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
        js_sources: &[String],
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

            // Inject JS data modules — evaluate each source and promote exports to globals
            for (i, source) in js_sources.iter().enumerate() {
                let mod_name = format!("__data_{i}");
                let declared = match Module::declare(ctx.clone(), mod_name.clone(), source.as_str())
                {
                    Ok(m) => m,
                    Err(rquickjs::Error::Exception) => return Err(catch_exception(&ctx)),
                    Err(e) => return Err(e),
                };
                let (module, promise) = match declared.eval() {
                    Ok(r) => r,
                    Err(rquickjs::Error::Exception) => return Err(catch_exception(&ctx)),
                    Err(e) => return Err(e),
                };
                if let Err(rquickjs::Error::Exception) = promise.finish::<()>() {
                    return Err(catch_exception(&ctx));
                }
                let namespace = module.namespace()?;
                for key in namespace.keys::<String>() {
                    let key = key?;
                    if key == "default" {
                        continue;
                    }
                    let val: rquickjs::Value = namespace.get(&key)?;
                    globals.set(key.as_str(), val)?;
                }
            }

            // Evaluate the compiled template JS
            let result: rquickjs::Value = match ctx.eval(js_code) {
                Ok(v) => v,
                Err(rquickjs::Error::Exception) => {
                    return Err(catch_exception(&ctx));
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
        Function::new(
            ctx.clone(),
            |text: rquickjs::Value<'_>, inline: Opt<bool>| {
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
            },
        )?,
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
                &[],
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
                &[],
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
                &[],
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
                &[],
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
                &[],
            )
            .unwrap();
        assert_eq!(result, "&lt;b&gt;bold&lt;/b&gt;");
    }

    #[test]
    fn eval_with_js_sources_function() {
        let engine = Engine::new().unwrap();
        let js_source =
            r#"export function greet(name) { return "Hello " + name + "!"; }"#.to_string();
        let data = serde_json::json!({"who": "Johan"});
        let result = engine
            .eval(
                r#"let __out = ""; __out += greet(who); __out;"#,
                &data,
                "http://localhost:3000",
                &[js_source],
            )
            .unwrap();
        assert_eq!(result, "Hello Johan!");
    }

    #[test]
    fn eval_js_data_default_export() {
        let result = eval_js_data(r#"export default { name: "Johan" };"#).unwrap();
        assert_eq!(result.values["name"], "Johan");
        assert!(!result.has_functions);
    }

    #[test]
    fn eval_js_data_named_exports() {
        let result =
            eval_js_data(r#"export const title = "Hello"; export const count = 42;"#).unwrap();
        assert_eq!(result.values["title"], "Hello");
        assert_eq!(result.values["count"], 42);
        assert!(!result.has_functions);
    }

    #[test]
    fn eval_js_data_skips_functions() {
        let result = eval_js_data(
            r#"export const name = "test"; export function url(page) { return "/"; }"#,
        )
        .unwrap();
        assert_eq!(result.values["name"], "test");
        assert!(result.values.get("url").is_none());
        assert!(result.has_functions);
    }

    #[test]
    fn call_js_function_returns_string() {
        let source =
            r#"export function url(page) { return "/writings/" + page.src.entry.name + "/"; }"#
                .to_string();
        let args = r#"{"src":{"path":"posts/my-post","ext":".md","entry":{"name":"my-post","path":"posts/my-post.md","type":"file","src":"src"}},"data":{}}"#;
        let result = call_js_function(&[source], "url", args).unwrap();
        assert_eq!(
            result,
            Some(serde_json::Value::String("/writings/my-post/".to_string()))
        );
    }

    #[test]
    fn call_js_function_returns_false() {
        let source = r#"export function url(page) { return false; }"#.to_string();
        let result = call_js_function(&[source], "url", "{}").unwrap();
        assert_eq!(result, Some(serde_json::Value::Bool(false)));
    }

    #[test]
    fn call_js_function_not_a_function() {
        let source = r#"export const url = "/static-path/";"#.to_string();
        let result = call_js_function(&[source], "url", "{}").unwrap();
        assert!(result.is_none()); // url is a string, not a function
    }

    #[test]
    fn eval_js_data_date() {
        let result = eval_js_data(r#"export default { date: new Date().toJSON() };"#).unwrap();
        assert!(result.values["date"].is_string());
        // ISO date string should contain "T" (e.g. "2026-02-27T...")
        assert!(result.values["date"].as_str().unwrap().contains('T'));
    }
}
