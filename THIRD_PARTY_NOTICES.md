# Third-Party Notices

## Purpose

This file records third-party software, datasets, model weights, APIs, research material, fonts,
icons and other assets used or redistributed by the project. It should be updated whenever a
dependency or external asset is added, replaced or redistributed.

## Software dependencies

The root `package.json` includes development tooling dependencies. Application and service
dependencies are declared in their respective package manifests and lockfiles. Their licences and
required notices must be reviewed before a release.

A generated dependency inventory or Software Bill of Materials (SBOM) should be attached to release
artefacts once release automation is established.

## Data sources

Data publishers retain their respective rights in source material. A source being publicly
accessible does not automatically grant redistribution rights. For each integrated dataset, see its
source record under `data/catalog/` for publisher, licence, attribution, retrieval details and
limitations.

Do not copy source data into this repository unless the licence and project policy permit it.

## AI models and model providers

Each model used by the project must be documented in `models/registry/` or an equivalent model card.
Model weights, tokenisers, embeddings, APIs and generated outputs may have different terms. Review
the relevant provider terms and model licence before use or redistribution.

No third-party model weights are intended to be bundled with this initial repository scaffold.

## Fonts, icons and visual assets

Record the source, version and licence for each bundled font, icon set, illustration, photograph or
other visual asset. Do not add assets without permission or a compatible licence. Keep notices
supplied by the original author.

## Current inventory

This repository scaffold does not intentionally bundle external datasets, model weights, research
papers, fonts, photographs or third-party visual assets. The dependency inventory will become more
specific as implementation begins.

| Component                | Source                          | Version                 | Licence / terms             | Notes                      |
| ------------------------ | ------------------------------- | ----------------------- | --------------------------- | -------------------------- |
| Root tooling             | See `package.json` and lockfile | Resolved during install | Verify each package licence | Development tooling only   |
| Application dependencies | Respective workspace manifests  | To be determined        | Must be verified            | Not yet inventoried        |
| Data sources             | `data/catalog/`                 | Per source              | Per source record           | Must be checked before use |
| AI models                | `models/registry/`              | Per model               | Per model/provider          | Must be checked before use |

## Updating this file

When adding a third-party dependency or asset:

1. verify its origin, version and licence;
2. record required attribution and notices;
3. check whether redistribution or commercial use is restricted;
4. add or update the relevant source/model record;
5. update this file and include the change in the pull request.
