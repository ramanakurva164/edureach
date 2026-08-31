import app from "./app.js";
import connectDB from "./config/database.config.js";
import { initializeKnowledgeBase } from "./services/rag.service.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
   try {
       await connectDB();
       await initializeKnowledgeBase();

       app.listen(PORT, () => {
           console.log(`Server running on port ${PORT}`);
       });
   } catch (error) {
       console.error("Failed to start server:", error);
       process.exit(1);
   }
};

start();