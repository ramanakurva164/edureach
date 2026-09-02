import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import {
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// ---- __dirname for ESM ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- MongoDB native client ----
let mongoClient = null;

const getMongoClient = async () => {
    if (!mongoClient) {
        mongoClient = new MongoClient(process.env.MONGODB_URI || "");
        await mongoClient.connect();
    }
    return mongoClient;
};

// ---- Google GenAI Embeddings ----
const getEmbeddings = () => {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not set in environment variables.");
    }
    return new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-embedding-001",
    });
};

// ---- Vector Store ----
const getVectorStore = async () => {
    const client = await getMongoClient();
    const collection = client.db("edusearch").collection("knowledge-base");

    return new MongoDBAtlasVectorSearch(getEmbeddings(), {
        collection: collection,
        indexName: "edusearch_vector_index",
        textKey: "text",
        embeddingKey: "embedding",
    });
};

// ============================================
// A) INDEXING — runs ONCE at server startup
// ============================================
export const initializeKnowledgeBase = async () => {
    const client = await getMongoClient();
    const collection = client.db("edusearch").collection("knowledge-base");

    // Check if knowledge base is already indexed with valid embeddings
    const docWithEmbedding = await collection.findOne({
        embedding: { $exists: true, $not: { $size: 0 } },
    });

    if (docWithEmbedding) {
        console.log(" Knowledge base already indexed — skipping.");
        return;
    }

    // Clean up any existing chunks with empty embeddings before re-indexing
    await collection.deleteMany({});

    console.log(" Indexing knowledge base...");

    // Verify API key FIRST with a test embedding
    const embeddings = getEmbeddings();
    try {
        const testResult=await embeddings.embedQuery("test")
        console.log(` API key OK — embedding dimensions: ${testResult.length}`);
    } catch (error) {
        console.error(" Embedding test failed!");
        console.error("   Error:", error.message || error);
        console.error("   Get key from: https://aistudio.google.com/apikey");
        throw error;
    }

    // LOAD
    const filePath = path.join(__dirname, "../../knowledge-base/edureach-knowledge.txt");
    const loader = new TextLoader(filePath);
    const docs = await loader.load();
    if (docs.length === 0) {
        throw new Error("No documents found in knowledge base file");
    }
    const totalCharacters = docs.reduce((sum, doc) => sum + doc.pageContent.length, 0);
    console.log(`    Loaded ${totalCharacters} characters`);

    // SPLIT
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const allSplits = await splitter.splitDocuments(docs);
    console.log(`    Split into ${allSplits.length} chunks`);

    // EMBED + STORE
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection: collection,
        indexName: "edusearch_vector_index",
        textKey: "text",
        embeddingKey: "embedding",
    });

    await vectorStore.addDocuments(allSplits);

    // VERIFY
    const verifyDoc = await collection.findOne({
        embedding: { $exists: true, $not: { $size: 0 } },
    });

    if (verifyDoc && Array.isArray(verifyDoc.embedding) && verifyDoc.embedding.length > 0) {
        console.log(`    ${allSplits.length} chunks stored (${verifyDoc.embedding.length}D embeddings)`);
        console.log(`     IMPORTANT: Create Atlas Vector Search index with numDimensions: ${verifyDoc.embedding.length}`);
    } else {
        await collection.deleteMany({});
        throw new Error(" Embeddings are empty! Google API returned no vectors.");
    }
};

// ============================================
// B) RAG RESPONSE — runs on every chat query
// ============================================
export const getRAGResponse = async (question) => {
    console.log("[RAG] Starting retrieval for question:", question);

    try {
        const vectorStore = await getVectorStore();
        console.log("[RAG] Vector store connected.");

        const retrievedDocs = await vectorStore.similaritySearch(question, 3);
        console.log("[RAG] Retrieved docs count:", retrievedDocs.length);

        if (retrievedDocs.length === 0) {
            console.log("[RAG] No docs found for the query.");
            return "I don't have that information right now. Please contact the college office for assistance.";
        }

        const context = retrievedDocs.map(doc => doc.pageContent).join("\n\n");
        console.log("[RAG] Context length:", context.length);

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            temperature: 0.7,
            apiKey: process.env.GOOGLE_API_KEY,
        });

        console.log("[RAG] Calling Gemini with model gemini-2.5-flash");
        const result = await model.invoke([
            { role: "system", content: `You are EduReach Bot. Answer based on this context:\n\n${context}` },
            { role: "user", content: question }
        ]);

        console.log("[RAG] Gemini response received.");
        return result.content;
    } catch (error) {
        console.error("[RAG] EXCEPTION:", {
            message: error.message,
            stack: error.stack,
            question,
            GOOGLE_API_KEY_SET: !!process.env.GOOGLE_API_KEY,
            MONGODB_URI_SET: !!process.env.MONGODB_URI,
        });
        return "I'm having trouble right now. Please try again or contact the college office for assistance.";
    }
};
