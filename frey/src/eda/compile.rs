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
                js.push_str(");\n");
            }
            Node::If(cond) => {
                js.push_str("if (");
                js.push_str(&compile_condition(cond));
                js.push_str(") {\n");
            }
            Node::ElseIf(cond) => {
                js.push_str("} else if (");
                js.push_str(&compile_condition(cond));
                js.push_str(") {\n");
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
                    // k, v of obj -> for (const [k, v] of Object.entries(obj))
                    js.push_str("for (const [");
                    js.push_str(binding);
                    js.push_str("] of Object.entries(");
                    js.push_str(&compiled_expr);
                    js.push_str(")) {\n");
                } else {
                    js.push_str("for (const ");
                    js.push_str(binding);
                    js.push_str(" of ");
                    js.push_str(&compiled_expr);
                    js.push_str(") {\n");
                }
            }
            Node::Set { name, expr } => {
                js.push_str("const ");
                js.push_str(name);
                js.push_str(" = (");
                js.push_str(&compile_pipes(expr));
                js.push_str(");\n");
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

/// Compile pipe expressions: `expr |> fn` -> `fn(expr)`, `expr |> fn(arg)` -> `fn(expr, arg)`
fn compile_pipes(expr: &str) -> String {
    let parts: Vec<&str> = expr.split("|>").collect();
    if parts.len() == 1 {
        return expr.trim().to_string();
    }

    let mut result = parts[0].trim().to_string();
    for pipe in &parts[1..] {
        let func = pipe.trim();
        if let Some(paren) = func.find('(') {
            // fn(args) -> __filters.fn(piped, args)
            let name = &func[..paren];
            let args = &func[paren + 1..func.len() - 1]; // strip parens
            result = format!("__filters.{name}({result}, {args})");
        } else {
            result = format!("__filters.{func}({result})");
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
fn guard_term(term: &str) -> String {
    if term.is_empty() {
        return term.to_string();
    }

    // Check for bare identifier or dotted path (e.g. `meta.description`)
    let root = term.split('.').next().unwrap_or(term);
    if is_bare_identifier(root) && !is_js_keyword(root) {
        format!("typeof {root} !== \"undefined\" && {term}")
    } else {
        term.to_string()
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
        assert!(js.contains(r#"__out += (typeof title !== "undefined" && title);"#));
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
        assert!(js.contains("if (x > 0) {"));
        assert!(js.contains("} else {"));
        assert!(js.contains("}"));
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
        assert!(js.contains("for (const item of items) {"));
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
        assert!(js.contains("for (const [k, v] of Object.entries(obj)) {"));
    }

    #[test]
    fn pipes() {
        assert_eq!(
            super::compile_pipes("name |> upper"),
            "__filters.upper(name)"
        );
        assert_eq!(
            super::compile_pipes("name |> trim |> upper"),
            "__filters.upper(__filters.trim(name))"
        );
    }

    #[test]
    fn pipes_with_args() {
        assert_eq!(
            super::compile_pipes("text |> md(true)"),
            "__filters.md(text, true)"
        );
        assert_eq!(
            super::compile_pipes("text |> slice(0, 5) |> upper"),
            "__filters.upper(__filters.slice(text, 0, 5))"
        );
    }

    #[test]
    fn compile_set() {
        let nodes = vec![Node::Set {
            name: "x".into(),
            expr: "42".into(),
        }];
        let js = compile(&nodes);
        assert!(js.contains("const x = (42);"));
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
