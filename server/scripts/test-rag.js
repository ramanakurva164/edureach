/**
 * Smoke-test: MongoDB connect → Atlas auto-embed index → store → query
 * (Voyage via Atlas Automated Embedding — no Gemini)
 *
 * Run from server/:  node --env-file=.env scripts/test-rag.js
 */
import ragService from "../src/services/rag.service.js";

const SAMPLE_CHUNKS = [
    "EduReach College is located in Hyderabad, Telangana, India.",
    "B.Tech Computer Science and Engineering (CSE) has 180 seats.",
    "Highest package Rs 42 LPA from Google. Average package Rs 8.5 LPA.",
];

const QUERY = "Where is EduReach College located?";

const step = (n, label) => console.log(`\n[${n}] ${label}`);

async function main() {
    console.log("=== RAG ops smoke test (Atlas Automated Embedding / Voyage) ===");

    step(1, "MongoDB connection (ping)");
    const conn = await ragService.testConnection();
    console.log("  ping ok:", conn.ok);
    console.log("  databases:", conn.databases.join(", ") || "(none)");

    step(2, "Ensure auto-embed index (voyage-3.5-lite)");
    const indexInfo = await ragService.createEmbeddings();
    console.log("  index:", indexInfo.indexName);
    console.log("  model:", indexInfo.model);
    console.log("  created now:", indexInfo.created);
    console.log("  status:", indexInfo.status);

    step(3, "Wait for index READY");
    const ready = await ragService.waitForIndexReady({ timeoutMs: 180_000, pollMs: 5_000 });
    console.log("  ready:", ready.ready, "| status:", ready.status, "| waitedMs:", ready.waitedMs);
    if (!ready.ready) {
        throw new Error(`Index not READY after ${ready.waitedMs}ms (status=${ready.status})`);
    }

    step(4, "Store text chunks (Atlas embeds server-side)");
    const stored = await ragService.storeEmbeddingsInDatabase(SAMPLE_CHUNKS);
    console.log("  insertedCount:", stored.insertedCount);
    console.log("  waiting 8s for indexing...");
    await new Promise((r) => setTimeout(r, 8000));

    step(5, `Query: "${QUERY}"`);
    const { match, score, results, totalDocs } = await ragService.queryDatabase(QUERY);
    console.log("  hits:", totalDocs);
    console.log("  best score:", score);
    console.log("  best match:", match?.text ?? "(none)");
    if (results?.length) {
        console.log("  top results:");
        for (const r of results) {
            console.log(`    - (${Number(r.score).toFixed(4)}) ${r.text}`);
        }
    }

    if (!match) throw new Error("Query returned no matches");

    console.log("\n=== All ops passed ===");
}

main().catch((err) => {
    console.error("\n=== Test failed ===");
    console.error(err.message || err);
    if (err.errorResponse) console.error(JSON.stringify(err.errorResponse, null, 2));
    process.exit(1);
});
