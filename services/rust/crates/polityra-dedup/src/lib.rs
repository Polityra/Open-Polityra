use sha2::{Digest, Sha256};
use std::collections::HashSet;

pub fn content_hash(normalized: &str) -> String {
    format!("{:x}", Sha256::digest(normalized.as_bytes()))
}

pub fn word_jaccard(left: &str, right: &str, min_token_length: usize) -> f64 {
    let left_tokens = tokens(left, min_token_length);
    let right_tokens = tokens(right, min_token_length);
    let union = left_tokens.union(&right_tokens).count();
    if union == 0 {
        return 1.0;
    }
    left_tokens.intersection(&right_tokens).count() as f64 / union as f64
}

fn tokens(input: &str, min_token_length: usize) -> HashSet<String> {
    input
        .split(|ch: char| !ch.is_alphanumeric())
        .map(|word| word.to_lowercase())
        .filter(|word| word.chars().count() >= min_token_length)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::{content_hash, word_jaccard};

    #[test]
    fn hash_is_stable() {
        assert_eq!(content_hash("same"), content_hash("same"));
        assert_ne!(content_hash("same"), content_hash("different"));
    }

    #[test]
    fn detects_near_duplicate_words() {
        let score = word_jaccard(
            "Government officials announced exercises next week",
            "Government officials announced the exercises next week",
            3,
        );
        assert!(score > 0.8);
    }
}
