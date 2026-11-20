use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineJob {
    pub id: Uuid,
    pub job_type: String,
    pub payload: Value,
    pub attempts: i32,
    pub max_attempts: i32,
    pub correlation_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceFetchPayload {
    #[serde(rename = "contractVersion", default = "default_contract_version")]
    pub contract_version: u8,
    #[serde(rename = "sourceId")]
    pub source_id: Uuid,
}

fn default_contract_version() -> u8 {
    1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchedDocument {
    pub external_id: Option<String>,
    pub title: String,
    pub canonical_url: String,
    pub original_url: String,
    pub document_type: String,
    pub published_at: Option<DateTime<Utc>>,
    pub raw_content: String,
    pub language: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionRequest {
    pub document_id: Uuid,
    pub source_id: Uuid,
    pub title: String,
    pub text: String,
    pub language: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
}
