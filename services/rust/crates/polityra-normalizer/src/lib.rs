pub fn normalize_text(input: &str) -> String {
    let without_tags = strip_markup(input);
    without_tags
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(2_000_000)
        .collect()
}

fn strip_markup(input: &str) -> String {
    let mut output = String::with_capacity(input.len());
    let mut in_tag = false;
    for ch in input.chars() {
        match ch {
            '<' => in_tag = true,
            '>' if in_tag => {
                in_tag = false;
                output.push(' ');
            }
            _ if !in_tag => output.push(ch),
            _ => {}
        }
    }
    output
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
}

#[cfg(test)]
mod tests {
    use super::normalize_text;

    #[test]
    fn normalizes_markup_and_whitespace() {
        assert_eq!(
            normalize_text("<p>Report &amp; <b>update</b></p>\n text"),
            "Report & update text"
        );
    }
}
