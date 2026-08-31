import { getRAGResponse } from "../services/rag.service.js";

export const sendMessage = async (req, res, next) => {
    try {
        const { message } = req.body;

        // Validate message
        if (!message || typeof message !== "string" || !message.trim()) {
            res.status(400).json({
                success: false,
                message: "Message is required and must be a non-empty string.",
            });
            return;
        }

        // Get AI response using RAG
        const answer = await getRAGResponse(message.trim());

        res.json({
            success: true,
            data: { message: answer },
        });
    } catch (error) {
        console.error("Error in sendMessage controller:", error.message);
        next(error);
    }
};