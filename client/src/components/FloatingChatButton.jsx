import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatDrawer from "./ChatDrawer.jsx";

export default function FloatingChatButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-maroon text-white rounded-full shadow-lg flex items-center justify-center hover:bg-maroon-dark transition-all duration-300 z-40"
            >
                <MessageCircle className="w-6 h-6" />
            </button>
            <ChatDrawer open={open} onClose={() => setOpen(false)} />
        </>
    );
}
