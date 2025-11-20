// import express package and all the required package
import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server, Socket } from "socket.io";

// Create Express app and HTTP Server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server 
export const io = new Server(server, {
    cors: { origin: "*" }
})

// Store Online Users
export const userSocketMap = {}; //{userId: socketId}

// Socket.io connection handler 
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId) userSocketMap[userId] = socket.id;

    // Emit Online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

// Create Middleware setup
app.use(express.json({ limit: "4mb" }));   //for images
app.use(cors());  //for urls to connect with backend 

// Routes Setup
app.use("/api/status", (req, res) => res.send("Server is Live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect MONGODB
await connectDB();

// defining port number where it will be live 
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is Running on PORT : " + PORT));