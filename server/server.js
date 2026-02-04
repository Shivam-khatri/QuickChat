// import express package and all the required package
import express from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";


// Create Express app
const app = express();

// Create Middleware setup
app.use(express.json({ limit: "4mb" }));   //for images
app.use(cors());  //for urls to connect with backend 

// Connect MONGODB on first request
let dbConnected = false;
const initDB = async () => {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
        } catch (error) {
            console.error("DB connection failed:", error);
        }
    }
};

// Routes Setup
app.use(async (req, res, next) => {
    await initDB();
    next();
});

app.get("/api/status", (req, res) => res.json({ status: "Server is Live" }));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

// For local development only
if (process.env.NODE_ENV !== "production") {
    import("http").then(({ default: http }) => {
        const server = http.createServer(app);
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log("Server is Running on PORT : " + PORT));
    }).catch(err => console.error("Failed to start server:", err));
}

// Export app for Vercel serverless deployment
export default app;