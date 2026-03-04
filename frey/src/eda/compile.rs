use super::parse::Node;

pub fn compile(nodes: &[Node]) -> String {
    let mut js = String::from("let __out = \"\";\n");

    for node in nodes {
        match node {
            Node::Text(text) => {
                js.push_str("__out += ");
                js.push_str(&quote_js_string(text));
                js.push_str(";\n");
            }
            Node::Print { expr, .. } => {
                let compiled_expr = compile_expr(expr);
                js.push_str("__out += (");
                js.push_str(&compiled_expr);
                js.push_str("); // {{ ");
                js.push_str(expr);
                js.push_str(" }}\n");
            }
            Node::If(cond) => {
                js.push_str("if (");
                js.push_str(&compile_condition(cond));
                js.push_str(") { // {{ if ");
                js.push_str(cond);
                js.push_str(" }}\n");
            }
            Node::ElseIf(cond) => {
                js.push_str("} else if (");
                js.push_str(&compile_condition(cond));
                js.push_str(") { // {{ else if ");
                js.push_str(cond);
                js.push_str(" }}\n");
            }
            Node::Else => {
                js.push_str("} else {\n");
            }
            Node::EndIf | Node::EndFor => {
                js.push_str("}\n");
            }
            Node::For { binding, expr } => {
                let compiled_expr = compile_pipes(expr);
                if binding.contains(',') {
                    js.push_str("for (const [");
                    js.push_str(binding);
                    js.push_str("] of Object.entries(");
                    js.push_str(&compiled_expr);
                    js.push_str(")) { // {{ for ");
                    js.push_str(binding);
                    js.push_str(" of ");
                    js.push_str(expr);
                    js.push_str(" }}\n");
                } else {
                    js.push_str("for (const ");
                    js.push_str(binding);
                    js.push_str(" of ");
                    js.push_str(&compiled_expr);
                    js.push_str(") { // {{ for ");
                    js.push_str(binding);
                    js.push_str(" of ");
                    js.push_str(expr);
                    js.push_str(" }}\n");
                }
            }
            Node::Set { name, expr } => {
                js.push_str("const ");
                js.push_str(name);
                js.push_str(" = (");
                js.push_str(&compile_pipes(expr));
                js.push_str("); // {{ set ");
                js.push_str(name);
                js.push_str(" = ");
                js.push_str(expr);
                js.push_str(" }}\n");
            }
            Node::Function { name, params } => {
                js.push_str("function ");
                js.push_str(name);
                js.push('(');
                js.push_str(params);
                js.push_str(") {\nlet __out = \"\";\n");
            }
            Node::EndFunction => {
                js.push_str("return __out;\n}\n");
            }
            Node::Comment | Node::Echo | Node::EndEcho => {
                // Comments produce no output. Echo/EndEcho are handled in parser.
            }
        }
    }

    js.push_str("__out;\n");
    js
}

/// Compile pipe expressions using `__pipe` runtime resolution:
/// `expr |> fn` -> `__pipe(expr, "fn")`, `expr |> fn(a, b)` -> `__pipe(expr, "fn", a, b)`
fn compile_pipes(expr: &str) -> String {
    let parts: Vec<&str> = expr.split("|>").collect();
    if parts.len() == 1 {
        return expr.trim().to_string();
    }

    let mut result = parts[0].trim().to_string();
    for pipe in &parts[1..] {
        let func = pipe.trim();
        if let Some(paren) = func.find('(') {
            let name = &func[..paren];
            let args = &func[paren + 1..func.len() - 1]; // strip parens
            result = format!("__pipe({result}, \"{name}\", {args})");
        } else {
            result = format!("__pipe({result}, \"{func}\")");
        }
    }
    result
}

/// Compile an expression with pipes and typeof guards for bare identifiers.
fn compile_expr(expr: &str) -> String {
    let compiled = compile_pipes(expr);
    guard_condition(&compiled)
}

/// Alias for if/else-if conditions (same logic).
fn compile_condition(cond: &str) -> String {
    compile_expr(cond)
}

fn guard_condition(expr: &str) -> String {
    // Split on || and && while preserving the operator, then guard each part
    let mut result = String::new();
    let mut rest = expr;

    while !rest.is_empty() {
        // Find the next || or &&
        let next_op = rest
            .find("||")
            .map(|i| (i, "||"))
            .into_iter()
            .chain(rest.find("&&").map(|i| (i, "&&")))
            .min_by_key(|(i, _)| *i);

        match next_op {
            Some((pos, op)) => {
                let term = rest[..pos].trim();
                result.push_str(&guard_term(term));
                result.push(' ');
                result.push_str(op);
                result.push(' ');
                rest = rest[pos + op.len()..].trim_start();
            }
            None => {
                result.push_str(&guard_term(rest.trim()));
                break;
            }
        }
    }

    result
}

/// Guard a single term: if it's a bare identifier, wrap with typeof check.
/// Dotted paths like `meta.description` need the root identifier guarded.
/// Comparison expressions like `type == 'post'` need the LHS guarded.
fn guard_term(term: &str) -> String {
    if term.is_empty() {
        return term.to_string();
    }

    // Check for comparison operators surrounded by whitespace and guard the LHS.
    // We require whitespace around operators to avoid matching inside arrow
    // functions (=>) or other non-comparison uses.
    for op in &[
        " === ", " !== ", " == ", " != ", " >= ", " <= ", " > ", " < ",
    ] {
        if let Some(pos) = term.find(op) {
            let lhs = term[..pos].trim();
            let op_trimmed = op.trim();
            let rhs = term[pos + op.len()..].trim();
            let guarded_lhs = guard_identifier(lhs);
            return format!("{guarded_lhs} {op_trimmed} {rhs}");
        }
    }

    guard_identifier(term)
}

/// If `expr` is a bare identifier or dotted path, wrap with a typeof guard.
fn guard_identifier(expr: &str) -> String {
    let root = expr.split('.').next().unwrap_or(expr);
    if is_bare_identifier(root) && !is_js_keyword(root) {
        format!("typeof {root} !== \"undefined\" && {expr}")
    } else {
        expr.to_string()
    }
}

fn is_bare_identifier(s: &str) -> bool {
    !s.is_empty()
        && s.starts_with(|c: char| c.is_ascii_alphabetic() || c == '_')
        && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
}

fn is_js_keyword(s: &str) -> bool {
    matches!(
        s,
        "true" | "false" | "null" | "undefined" | "this" | "new" | "typeof" | "void"
    )
}

fn quote_js_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            _ => out.push(ch),
        }
    }
    out.push('"');
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compile_text_only() {
        let nodes = vec![Node::Text("Hello".into())];
        let js = compile(&nodes);
        assert_eq!(js, "let __out = \"\";\n__out += \"Hello\";\n__out;\n");
    }

    #[test]
    fn compile_print() {
        let nodes = vec![
            Node::Text("<h1>".into()),
            Node::Print {
                expr: "title".into(),
                trim_before: false,
                trim_after: false,
            },
            Node::Text("</h1>".into()),
        ];
        let js = compile(&nodes);
        assert!(js.contains("__out += \"<h1>\";"));
        assert!(js.contains(r#"__out += (typeof title !== "undefined" && title); // {{ title }}"#));
        assert!(js.contains("__out += \"</h1>\";"));
    }

    #[test]
    fn compile_if_else() {
        let nodes = vec![
            Node::If("x > 0".into()),
            Node::Text("positive".into()),
            Node::Else,
            Node::Text("non-positive".into()),
            Node::EndIf,
        ];
        let js = compile(&nodes);
        assert!(js.contains(r#"if (typeof x !== "undefined" && x > 0) { // {{ if x > 0 }}"#));
        assert!(js.contains("} else {"));
        assert!(js.contains("}"));
    }

    #[test]
    fn compile_if_comparison_guards_lhs() {
        let nodes = vec![
            Node::If("type == 'post'".into()),
            Node::Text("is post".into()),
            Node::EndIf,
        ];
        let js = compile(&nodes);
        assert!(js.contains(
            r#"if (typeof type !== "undefined" && type == 'post') { // {{ if type == 'post' }}"#
        ));
    }

    #[test]
    fn compile_if_dotted_comparison() {
        let nodes = vec![
            Node::If("menu.visible == true".into()),
            Node::Text("visible".into()),
            Node::EndIf,
        ];
        let js = compile(&nodes);
        assert!(js.contains(r#"if (typeof menu !== "undefined" && menu.visible == true) { // {{ if menu.visible == true }}"#));
    }

    #[test]
    fn compile_for() {
        let nodes = vec![
            Node::For {
                binding: "item".into(),
                expr: "items".into(),
            },
            Node::Print {
                expr: "item".into(),
                trim_before: false,
                trim_after: false,
            },
            Node::EndFor,
        ];
        let js = compile(&nodes);
        assert!(js.contains("for (const item of items) { // {{ for item of items }}"));
    }

    #[test]
    fn compile_for_kv() {
        let nodes = vec![
            Node::For {
                binding: "k, v".into(),
                expr: "obj".into(),
            },
            Node::EndFor,
        ];
        let js = compile(&nodes);
        assert!(
            js.contains("for (const [k, v] of Object.entries(obj)) { // {{ for k, v of obj }}")
        );
    }

    #[test]
    fn pipes() {
        assert_eq!(
            super::compile_pipes("name |> upper"),
            r#"__pipe(name, "upper")"#
        );
        assert_eq!(
            super::compile_pipes("name |> trim |> upper"),
            r#"__pipe(__pipe(name, "trim"), "upper")"#
        );
    }

    #[test]
    fn pipes_with_args() {
        assert_eq!(
            super::compile_pipes("text |> md(true)"),
            r#"__pipe(text, "md", true)"#
        );
        assert_eq!(
            super::compile_pipes("text |> slice(0, 5) |> upper"),
            r#"__pipe(__pipe(text, "slice", 0, 5), "upper")"#
        );
    }

    #[test]
    fn pipes_js_globals() {
        assert_eq!(
            super::compile_pipes("x |> JSON.stringify"),
            r#"__pipe(x, "JSON.stringify")"#
        );
    }

    #[test]
    fn pipes_prototype_method() {
        assert_eq!(
            super::compile_pipes("s |> toUpperCase"),
            r#"__pipe(s, "toUpperCase")"#
        );
        assert_eq!(
            super::compile_pipes("s |> slice(0, 3)"),
            r#"__pipe(s, "slice", 0, 3)"#
        );
    }

    #[test]
    fn pipes_chaining_mixed() {
        assert_eq!(
            super::compile_pipes("s |> trim |> toUpperCase"),
            r#"__pipe(__pipe(s, "trim"), "toUpperCase")"#
        );
    }

    #[test]
    fn compile_set() {
        let nodes = vec![Node::Set {
            name: "x".into(),
            expr: "42".into(),
        }];
        let js = compile(&nodes);
        assert!(js.contains("const x = (42); // {{ set x = 42 }}"));
    }

    #[test]
    fn compile_function() {
        let nodes = vec![
            Node::Function {
                name: "greet".into(),
                params: "name".into(),
            },
            Node::Text("Hello ".into()),
            Node::Print {
                expr: "name".into(),
                trim_before: false,
                trim_after: false,
            },
            Node::Text("!".into()),
            Node::EndFunction,
        ];
        let js = compile(&nodes);
        assert!(js.contains("function greet(name) {\nlet __out = \"\";"));
        assert!(js.contains("return __out;\n}"));
    }

    #[test]
    fn escape_special_chars() {
        let js = quote_js_string("line1\nline2\t\"quoted\"");
        assert_eq!(js, r#""line1\nline2\t\"quoted\"""#);
    }
}
