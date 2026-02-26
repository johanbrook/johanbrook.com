mod compile;
mod engine;
mod parse;

use engine::Engine;

pub struct Template {
    js_code: String,
}

impl Template {
    pub fn from_str(source: &str) -> Self {
        let nodes = parse::parse(source);
        let js_code = compile::compile(&nodes);
        Self { js_code }
    }

    pub fn render(&self, data: &serde_json::Value, location: &str) -> Result<String, TemplateError> {
        let engine = Engine::new().map_err(TemplateError::Runtime)?;
        engine
            .eval(&self.js_code, data, location)
            .map_err(TemplateError::Runtime)
    }
}

#[derive(Debug)]
pub enum TemplateError {
    Runtime(rquickjs::Error),
}

impl std::fmt::Display for TemplateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TemplateError::Runtime(e) => write!(f, "template error: {e}"),
        }
    }
}

impl std::error::Error for TemplateError {}

#[cfg(test)]
mod tests {
    use super::*;

    const LOC: &str = "http://localhost:3000";

    #[test]
    fn full_render_simple() {
        let tpl = Template::from_str("Hello {{ name }}!");
        let result = tpl
            .render(&serde_json::json!({"name": "Johan"}), LOC)
            .unwrap();
        assert_eq!(result, "Hello Johan!");
    }

    #[test]
    fn full_render_if() {
        let tpl = Template::from_str("{{ if show }}visible{{ /if }}");
        assert_eq!(
            tpl.render(&serde_json::json!({"show": true}), LOC).unwrap(),
            "visible"
        );
        assert_eq!(
            tpl.render(&serde_json::json!({"show": false}), LOC).unwrap(),
            ""
        );
    }

    #[test]
    fn full_render_for() {
        let tpl = Template::from_str("<ul>{{ for item of items }}<li>{{ item }}</li>{{ /for }}</ul>");
        let result = tpl
            .render(&serde_json::json!({"items": ["one", "two"]}), LOC)
            .unwrap();
        assert_eq!(result, "<ul><li>one</li><li>two</li></ul>");
    }

    #[test]
    fn full_render_for_kv() {
        let tpl = Template::from_str("{{ for k, v of obj }}{{ k }}={{ v }} {{ /for }}");
        let result = tpl
            .render(&serde_json::json!({"obj": {"a": 1, "b": 2}}), LOC)
            .unwrap();
        assert!(result.contains("a=1"));
        assert!(result.contains("b=2"));
    }

    #[test]
    fn full_render_pipes() {
        let tpl = Template::from_str("{{ html |> escape }}");
        let result = tpl
            .render(&serde_json::json!({"html": "<b>hi</b>"}), LOC)
            .unwrap();
        assert_eq!(result, "&lt;b&gt;hi&lt;/b&gt;");
    }

    #[test]
    fn full_render_nested_if_for() {
        let tpl = Template::from_str(
            "{{ for item of items }}{{ if item.show }}{{ item.name }}{{ /if }}{{ /for }}",
        );
        let result = tpl
            .render(&serde_json::json!({
                "items": [
                    {"name": "a", "show": true},
                    {"name": "b", "show": false},
                    {"name": "c", "show": true},
                ]
            }), LOC)
            .unwrap();
        assert_eq!(result, "ac");
    }

    #[test]
    fn full_render_set() {
        let tpl = Template::from_str("{{ set greeting = \"Hi\" }}{{ greeting }}!");
        let result = tpl.render(&serde_json::json!({}), LOC).unwrap();
        assert_eq!(result, "Hi!");
    }

    #[test]
    fn full_render_comment_ignored() {
        let tpl = Template::from_str("before{{# this is a comment }}after");
        let result = tpl.render(&serde_json::json!({}), LOC).unwrap();
        assert_eq!(result, "beforeafter");
    }

    #[test]
    fn full_render_echo() {
        let tpl = Template::from_str("{{ echo }}{{ name }}{{ /echo }}");
        let result = tpl.render(&serde_json::json!({}), LOC).unwrap();
        assert_eq!(result, "{{ name }}");
    }

    #[test]
    fn full_render_trim() {
        let tpl = Template::from_str("  {{- name -}}  rest");
        let result = tpl
            .render(&serde_json::json!({"name": "x"}), LOC)
            .unwrap();
        assert_eq!(result, "xrest");
    }

    #[test]
    fn full_render_else_if() {
        let tpl =
            Template::from_str("{{ if x == 1 }}one{{ else if x == 2 }}two{{ else }}other{{ /if }}");
        assert_eq!(
            tpl.render(&serde_json::json!({"x": 1}), LOC).unwrap(),
            "one"
        );
        assert_eq!(
            tpl.render(&serde_json::json!({"x": 2}), LOC).unwrap(),
            "two"
        );
        assert_eq!(
            tpl.render(&serde_json::json!({"x": 3}), LOC).unwrap(),
            "other"
        );
    }

    #[test]
    fn full_render_empty() {
        let tpl = Template::from_str("");
        let result = tpl.render(&serde_json::json!({}), LOC).unwrap();
        assert_eq!(result, "");
    }

    #[test]
    fn full_render_escape() {
        let tpl = Template::from_str("{{ content |> escape }}");
        let result = tpl
            .render(&serde_json::json!({"content": "<script>alert('xss')</script>"}), LOC)
            .unwrap();
        assert_eq!(
            result,
            "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
        );
    }

    #[test]
    fn full_render_unescape() {
        let tpl = Template::from_str("{{ content |> unescape }}");
        let result = tpl
            .render(&serde_json::json!({"content": "&lt;b&gt;bold&lt;/b&gt;"}), LOC)
            .unwrap();
        assert_eq!(result, "<b>bold</b>");
    }

    #[test]
    fn full_render_escape_unescape_roundtrip() {
        let tpl = Template::from_str("{{ content |> escape |> unescape }}");
        let result = tpl
            .render(&serde_json::json!({"content": "<div class=\"x\">hi</div>"}), LOC)
            .unwrap();
        assert_eq!(result, "<div class=\"x\">hi</div>");
    }

    #[test]
    fn full_render_empty_filter() {
        let tpl = Template::from_str(
            "{{ if items |> empty }}no items{{ else }}has items{{ /if }}",
        );
        assert_eq!(
            tpl.render(&serde_json::json!({"items": []}), LOC).unwrap(),
            "no items"
        );
        assert_eq!(
            tpl.render(&serde_json::json!({"items": [1]}), LOC).unwrap(),
            "has items"
        );
    }

    #[test]
    fn full_render_empty_filter_string() {
        let tpl = Template::from_str("{{ if name |> empty }}anonymous{{ else }}{{ name }}{{ /if }}");
        assert_eq!(
            tpl.render(&serde_json::json!({"name": ""}), LOC).unwrap(),
            "anonymous"
        );
        assert_eq!(
            tpl.render(&serde_json::json!({"name": "  "}), LOC).unwrap(),
            "anonymous"
        );
        assert_eq!(
            tpl.render(&serde_json::json!({"name": "Johan"}), LOC).unwrap(),
            "Johan"
        );
    }

    #[test]
    fn full_render_function_simple() {
        let tpl = Template::from_str(
            "{{ function greet(name) }}Hello {{ name }}!{{ /function }}{{ greet(\"World\") }}",
        );
        let result = tpl.render(&serde_json::json!({}), LOC).unwrap();
        assert_eq!(result, "Hello World!");
    }

    #[test]
    fn full_render_function_with_data() {
        let tpl = Template::from_str(
            "{{ function greet(name) }}Hello {{ name }}!{{ /function }}{{ greet(who) }}",
        );
        let result = tpl
            .render(&serde_json::json!({"who": "Johan"}), LOC)
            .unwrap();
        assert_eq!(result, "Hello Johan!");
    }

    #[test]
    fn full_render_function_with_if() {
        let tpl = Template::from_str(
            "{{ function status(done) }}{{ if done }}Yes{{ else }}No{{ /if }}{{ /function }}{{ status(true) }}/{{ status(false) }}",
        );
        let result = tpl.render(&serde_json::json!({}), LOC).unwrap();
        assert_eq!(result, "Yes/No");
    }

    #[test]
    fn full_render_function_multiple_calls() {
        let tpl = Template::from_str(
            "{{ function star() }}*{{ /function }}{{ star() }}{{ star() }}{{ star() }}",
        );
        let result = tpl.render(&serde_json::json!({}), LOC).unwrap();
        assert_eq!(result, "***");
    }

    #[test]
    fn full_render_function_with_for() {
        let tpl = Template::from_str(
            "{{ function list(items) }}{{ for item of items }}[{{ item }}]{{ /for }}{{ /function }}{{ list(things) }}",
        );
        let result = tpl
            .render(&serde_json::json!({"things": ["a", "b"]}), LOC)
            .unwrap();
        assert_eq!(result, "[a][b]");
    }

    #[test]
    fn full_render_function_outer_scope() {
        let tpl = Template::from_str(
            "{{ set prefix = \"Hi\" }}{{ function greet(name) }}{{ prefix }} {{ name }}!{{ /function }}{{ greet(\"World\") }}",
        );
        let result = tpl.render(&serde_json::json!({}), LOC).unwrap();
        assert_eq!(result, "Hi World!");
    }

    #[test]
    fn full_render_function_with_pipe() {
        let tpl = Template::from_str(
            "{{ set safe_name = name |> escape }}{{ function wrap(text) }}<b>{{ text }}</b>{{ /function }}{{ wrap(safe_name) }}",
        );
        let result = tpl
            .render(&serde_json::json!({"name": "<script>"}), LOC)
            .unwrap();
        assert_eq!(result, "<b>&lt;script&gt;</b>");
    }

    #[test]
    fn full_render_safe() {
        let tpl = Template::from_str("{{ html |> safe }}");
        let result = tpl
            .render(&serde_json::json!({"html": "<b>trusted</b>"}), LOC)
            .unwrap();
        assert_eq!(result, "<b>trusted</b>");
    }

    #[test]
    fn full_render_md_block() {
        let tpl = Template::from_str("{{ text |> md }}");
        let result = tpl
            .render(&serde_json::json!({"text": "**bold**"}), LOC)
            .unwrap();
        assert!(result.contains("<p><strong>bold</strong></p>"));
    }

    #[test]
    fn full_render_md_inline() {
        let tpl = Template::from_str("{{ text |> md(true) }}");
        let result = tpl
            .render(&serde_json::json!({"text": "**bold**"}), LOC)
            .unwrap();
        assert_eq!(result, "<strong>bold</strong>");
    }

    #[test]
    fn full_render_url_filter() {
        let tpl = Template::from_str("{{ \"/foo\" |> url }}");
        let result = tpl
            .render(&serde_json::json!({}), "https://johan.im")
            .unwrap();
        assert_eq!(result, "https://johan.im/foo");
    }
}
