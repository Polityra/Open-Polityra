# User roles

The current dashboard uses application authentication and roles defined by the API. This guide describes intended product-level responsibilities; it does not grant permissions or replace the authorization checks in code.

| Role | Intended responsibility |
|---|---|
| Viewer | Read available research outputs and their provenance/limitations. |
| Analyst | Explore data and create or compare permitted analyses. |
| Editor | Prepare research material for review. |
| Admin | Manage users and project configuration where authorized. |

The fiscal-balance prototype is read-only with respect to the source dataset. Scenario inputs are validated per request and do not persist a user's analysis. Authentication and authorization behavior should be tested independently for every protected API route.

Do not use prototype outputs as the sole basis for financial, public-policy, security, or operational decisions.