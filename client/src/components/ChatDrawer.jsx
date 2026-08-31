import { useState } from "react";
import { X, Send, Bot, User, Minus } from "lucide-react";
import { sendMessage } from "../services/chat.service.js";

// You will implement the full ChatDrawer component in further sessions
const quickQuestions = [
    "What courses do you offer?",
    "Tell me about placements",
    "What is the fee structure?",
    "How to apply for admissions?",
];

export default function ChatDrawer({ open, onClose }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: `Hi there! I'm EduReach Bot. Ask me anything about courses, fees, admissions, or campus life.`,
            sender: "bot",
        },
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async (text) => {
        const messageText = text || input.trim();
        if (!messageText || sending) return;

        const userMsg = { id: Date.now(), text: messageText, sender: "user" };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setSending(true);

        try {
            // You will implement the API call in further sessions
            const data = await sendMessage(messageText);
            const botMsg = { id: Date.now() + 1, text: data.message, sender: "bot" };
            setMessages((prev) => [...prev, botMsg]);
        } catch {
            const errorMsg = { id: Date.now() + 1, text: "Sorry, something went wrong. Please try again.", sender: "bot" };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setSending(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-maroon px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">EduReach Bot</h3>
                        <p className="text-white/70 text-xs">Ask me anything</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onClose} className="text-white/70 hover:text-white p-1 transition-colors duration-200">
                        <Minus className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="text-white/70 hover:text-white p-1 transition-colors duration-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.sender === "bot" && (
                            <div className="w-6 h-6 bg-maroon rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3 h-3 text-white" />
                            </div>
                        )}
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            msg.sender === "user"
                                ? "bg-maroon text-white rounded-br-sm"
                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                        }`}>
                            {msg.text}
                        </div>
                        {msg.sender === "user" && (
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={{ current: null }} />
            </div>

            {/* Quick questions */}
            {messages.length === 1 && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {quickQuestions.map((q) => (
                            <button key={q} onClick={() => handleSend(q)}
                                className="text-xs px-2.5 py-1 bg-white border border-maroon/20 text-maroon rounded-full hover:bg-maroon hover:text-white transition-colors duration-200">
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-3">
                <div className="flex items-center gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..." disabled={sending}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-maroon text-sm disabled:opacity-50 transition-colors duration-200" />
                    <button onClick={() => handleSend()} disabled={!input.trim() || sending}
                        className="w-9 h-9 bg-maroon text-white rounded-lg flex items-center justify-center hover:bg-maroon-dark disabled:opacity-50 transition-colors duration-200">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
