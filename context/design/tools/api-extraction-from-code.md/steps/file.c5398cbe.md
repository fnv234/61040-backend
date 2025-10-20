---
timestamp: 'Mon Oct 20 2025 11:59:19 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_115919.cfccca60.md]]'
content_id: c5398cbe72df4e6ab9c58beb7f69ee31f48061f25d145070d2b196c90946357e
---

# file: deno.json

```json
{
    "imports": {
        "@concepts/": "./src/concepts/",
        "@google/generative-ai": "npm:@google/generative-ai@^0.24.1",
        "@utils/": "./src/utils/"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}
```
