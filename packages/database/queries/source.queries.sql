-- Source queries

INSERT INTO sources (name, publisher, url, license, data_type, category, description)
VALUES (:name, :publisher, :url, :license, :data_type, :category, :description)
RETURNING *;

SELECT * FROM sources ORDER BY updated_at DESC;

SELECT * FROM sources WHERE id = :id;

-- Datasets by source
SELECT * FROM datasets WHERE source_id = :sourceId ORDER BY created_at DESC;
