#[derive(Debug, PartialEq)]
pub enum Node {
    Text(String),
    Print {
        expr: String,
        trim_before: bool,
        trim_after: bool,
    },
    If(String),
    ElseIf(String),
    Else,
    EndIf,
    For {
        binding: String,
        expr: String,
    },
    EndFor,
    Set {
        name: String,
        expr: String,
    },
    Comment,
    Echo,
    EndEcho,
    Function {
        name: String,
        params: String,
    },
    EndFunction,
}

pub fn parse(input: &str) -> Vec<Node> {
    let mut nodes = Vec::new();
    let mut rest = input;

    while !rest.is_empty() {
        if let Some(tag_start) = rest.find("{{") {
            // Text before the tag
            if tag_start > 0 {
                nodes.push(Node::Text(rest[..tag_start].to_string()));
            }

            let after_open = &rest[tag_start + 2..];

            // Block comments: {{# ... #}} — scan for #}} to allow nested {{ }}
            if after_open.starts_with('#') {
                if let Some(end) = after_open.find("#}}") {
                    nodes.push(Node::Comment);
                    rest = &after_open[end + 3..];
                } else {
                    // Unclosed comment — treat rest as text
                    nodes.push(Node::Text(rest.to_string()));
                    break;
                }
            } else if let Some(tag_end) = after_open.find("}}") {
                let raw_tag = &after_open[..tag_end];
                let tag_node = parse_tag(raw_tag);
                nodes.push(tag_node);
                rest = &after_open[tag_end + 2..];
            } else {
                // Unclosed tag — treat rest as text
                nodes.push(Node::Text(rest.to_string()));
                break;
            }
        } else {
            // No more tags
            nodes.push(Node::Text(rest.to_string()));
            break;
        }
    }

    // Handle echo blocks: collapse Echo...EndEcho into Text nodes
    collapse_echo_blocks(&mut nodes);
    // Apply whitespace trimming
    apply_trim(&mut nodes);

    nodes
}

fn parse_tag(raw: &str) -> Node {
    let trim_before = raw.starts_with('-');
    let trim_after = raw.ends_with('-');

    let inner = raw.trim_start_matches('-').trim_end_matches('-').trim();

    // Comment
    if inner.starts_with('#') {
        return Node::Comment;
    }

    // Block closers
    match inner {
        "/if" => return Node::EndIf,
        "/for" => return Node::EndFor,
        "/echo" => return Node::EndEcho,
        "/function" => return Node::EndFunction,
        "else" => return Node::Else,
        _ => {}
    }

    // echo
    if inner == "echo" {
        return Node::Echo;
    }

    // else if
    if let Some(cond) = inner.strip_prefix("else if ") {
        return Node::ElseIf(cond.trim().to_string());
    }

    // if
    if let Some(cond) = inner.strip_prefix("if ") {
        return Node::If(cond.trim().to_string());
    }

    // function
    if let Some(rest) = inner.strip_prefix("function ") {
        return parse_function(rest.trim());
    }

    // for
    if let Some(rest) = inner.strip_prefix("for ") {
        return parse_for(rest.trim());
    }

    // set
    if let Some(rest) = inner.strip_prefix("set ")
        && let Some((name, expr)) = rest.split_once('=')
    {
        return Node::Set {
            name: name.trim().to_string(),
            expr: expr.trim().to_string(),
        };
    }

    // Default: print expression
    Node::Print {
        expr: inner.to_string(),
        trim_before,
        trim_after,
    }
}

fn parse_for(rest: &str) -> Node {
    // "x of expr" or "k, v of expr"
    if let Some((binding, expr)) = rest.split_once(" of ") {
        Node::For {
            binding: binding.trim().to_string(),
            expr: expr.trim().to_string(),
        }
    } else {
        // Malformed for — treat as print
        Node::Print {
            expr: format!("for {rest}"),
            trim_before: false,
            trim_after: false,
        }
    }
}

fn parse_function(rest: &str) -> Node {
    if let Some(paren_start) = rest.find('(')
        && let Some(paren_end) = rest.find(')')
    {
        let name = rest[..paren_start].trim().to_string();
        let params = rest[paren_start + 1..paren_end].trim().to_string();
        return Node::Function { name, params };
    }
    // Malformed — treat as print
    Node::Print {
        expr: format!("function {rest}"),
        trim_before: false,
        trim_after: false,
    }
}

fn collapse_echo_blocks(nodes: &mut Vec<Node>) {
    let mut i = 0;
    while i < nodes.len() {
        if matches!(nodes[i], Node::Echo) {
            // Find matching EndEcho
            let start = i;
            let mut j = i + 1;
            let mut depth = 1;
            while j < nodes.len() && depth > 0 {
                match &nodes[j] {
                    Node::Echo => depth += 1,
                    Node::EndEcho => depth -= 1,
                    _ => {}
                }
                j += 1;
            }
            // Collect everything between Echo and EndEcho as literal text
            let mut text = String::new();
            // We need to reconstruct original text for non-Text nodes
            for node in &nodes[start + 1..j - 1] {
                match node {
                    Node::Text(t) => text.push_str(t),
                    other => {
                        text.push_str("{{ ");
                        text.push_str(&reconstruct_tag(other));
                        text.push_str(" }}");
                    }
                }
            }
            nodes.drain(start..j);
            nodes.insert(start, Node::Text(text));
            i = start + 1;
        } else {
            i += 1;
        }
    }
}

fn reconstruct_tag(node: &Node) -> String {
    match node {
        Node::Print { expr, .. } => expr.clone(),
        Node::If(cond) => format!("if {cond}"),
        Node::ElseIf(cond) => format!("else if {cond}"),
        Node::Else => "else".to_string(),
        Node::EndIf => "/if".to_string(),
        Node::For { binding, expr } => format!("for {binding} of {expr}"),
        Node::EndFor => "/for".to_string(),
        Node::Set { name, expr } => format!("set {name} = {expr}"),
        Node::Comment => "#".to_string(),
        Node::Echo => "echo".to_string(),
        Node::EndEcho => "/echo".to_string(),
        Node::Function { name, params } => format!("function {name}({params})"),
        Node::EndFunction => "/function".to_string(),
        Node::Text(_) => String::new(),
    }
}

fn apply_trim(nodes: &mut [Node]) {
    // Find nodes that request trimming and modify adjacent Text nodes
    let trims: Vec<(usize, bool, bool)> = nodes
        .iter()
        .enumerate()
        .filter_map(|(i, n)| {
            if let Node::Print {
                trim_before,
                trim_after,
                ..
            } = n
            {
                if *trim_before || *trim_after {
                    return Some((i, *trim_before, *trim_after));
                }
            }
            None
        })
        .collect();

    for (i, trim_before, trim_after) in trims {
        if trim_before
            && i > 0
            && let Node::Text(ref mut t) = nodes[i - 1]
        {
            *t = t.trim_end().to_string();
        }
        if trim_after
            && i + 1 < nodes.len()
            && let Node::Text(ref mut t) = nodes[i + 1]
        {
            *t = t.trim_start().to_string();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn text_only() {
        let nodes = parse("Hello world");
        assert_eq!(nodes, vec![Node::Text("Hello world".into())]);
    }

    #[test]
    fn simple_print() {
        let nodes = parse("Hello {{ name }}!");
        assert_eq!(
            nodes,
            vec![
                Node::Text("Hello ".into()),
                Node::Print {
                    expr: "name".into(),
                    trim_before: false,
                    trim_after: false,
                },
                Node::Text("!".into()),
            ]
        );
    }

    #[test]
    fn if_else_endif() {
        let nodes = parse("{{ if x }}yes{{ else }}no{{ /if }}");
        assert_eq!(
            nodes,
            vec![
                Node::If("x".into()),
                Node::Text("yes".into()),
                Node::Else,
                Node::Text("no".into()),
                Node::EndIf,
            ]
        );
    }

    #[test]
    fn for_loop() {
        let nodes = parse("{{ for item of items }}{{ item }}{{ /for }}");
        assert_eq!(
            nodes,
            vec![
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
            ]
        );
    }

    #[test]
    fn for_key_value() {
        let nodes = parse("{{ for k, v of obj }}{{ k }}={{ v }}{{ /for }}");
        assert_eq!(
            nodes,
            vec![
                Node::For {
                    binding: "k, v".into(),
                    expr: "obj".into(),
                },
                Node::Print {
                    expr: "k".into(),
                    trim_before: false,
                    trim_after: false,
                },
                Node::Text("=".into()),
                Node::Print {
                    expr: "v".into(),
                    trim_before: false,
                    trim_after: false,
                },
                Node::EndFor,
            ]
        );
    }

    #[test]
    fn set_variable() {
        let nodes = parse("{{ set x = 42 }}{{ x }}");
        assert_eq!(
            nodes,
            vec![
                Node::Set {
                    name: "x".into(),
                    expr: "42".into(),
                },
                Node::Print {
                    expr: "x".into(),
                    trim_before: false,
                    trim_after: false,
                },
            ]
        );
    }

    #[test]
    fn comment() {
        let nodes = parse("before{{# ignored }}after");
        assert_eq!(
            nodes,
            vec![
                Node::Text("before".into()),
                Node::Comment,
                Node::Text("after".into()),
            ]
        );
    }

    #[test]
    fn trim() {
        let nodes = parse("  {{- x -}}  ");
        assert_eq!(
            nodes,
            vec![
                Node::Text("".into()),
                Node::Print {
                    expr: "x".into(),
                    trim_before: true,
                    trim_after: true,
                },
                Node::Text("".into()),
            ]
        );
    }

    #[test]
    fn echo_passthrough() {
        let nodes = parse("{{ echo }}{{ if x }}literal{{ /if }}{{ /echo }}");
        assert_eq!(nodes, vec![Node::Text("{{ if x }}literal{{ /if }}".into())]);
    }

    #[test]
    fn function_definition() {
        let nodes = parse("{{ function greet(name) }}Hello {{ name }}!{{ /function }}");
        assert_eq!(
            nodes,
            vec![
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
            ]
        );
    }

    #[test]
    fn function_multiple_params() {
        let nodes = parse("{{ function add(a, b) }}{{ a + b }}{{ /function }}");
        assert_eq!(
            nodes,
            vec![
                Node::Function {
                    name: "add".into(),
                    params: "a, b".into(),
                },
                Node::Print {
                    expr: "a + b".into(),
                    trim_before: false,
                    trim_after: false,
                },
                Node::EndFunction,
            ]
        );
    }

    #[test]
    fn function_no_params() {
        let nodes = parse("{{ function hr() }}<hr>{{ /function }}");
        assert_eq!(
            nodes,
            vec![
                Node::Function {
                    name: "hr".into(),
                    params: "".into(),
                },
                Node::Text("<hr>".into()),
                Node::EndFunction,
            ]
        );
    }

    #[test]
    fn else_if() {
        let nodes = parse("{{ if a }}1{{ else if b }}2{{ else }}3{{ /if }}");
        assert_eq!(
            nodes,
            vec![
                Node::If("a".into()),
                Node::Text("1".into()),
                Node::ElseIf("b".into()),
                Node::Text("2".into()),
                Node::Else,
                Node::Text("3".into()),
                Node::EndIf,
            ]
        );
    }
}
