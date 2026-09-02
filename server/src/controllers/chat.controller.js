import { getRAGResponse } from "../services/rag.service.js";

export const sendMessage = async (req, res, next) => {
    const requestStart = Date.now();

    console.log("[CHAT API] Incoming request:", {
        route: req.originalUrl || req.url,
        method: req.method,
        body: req.body,
        headers: {
            origin: req.headers.origin,
            "content-type": req.headers["content-type"],
        },
    });

    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            console.log("[CHAT API] Validation failed for incoming payload.", { message });
            res.status(400).json({
                success: false,
                message: "Message is required and must be a non-empty string.",
            });
            return;
        }

        console.log("[CHAT API] Processing question:", message.trim());

        const answer = await getRAGResponse(message.trim());

        console.log("[CHAT API] Response generated in ms:", Date.now() - requestStart);
        console.log("[CHAT API] Final answer preview:", String(answer).slice(0, 300));

        res.json({
            success: true,
            data: { message: answer },
        });
    } catch (error) {
        console.error("[CHAT API] Error in sendMessage controller:", {
            message: error.message,
            stack: error.stack,
            body: req.body,
        });
        next(error);
    }
};