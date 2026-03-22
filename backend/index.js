import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join_game", (gameId) => {
    socket.join(gameId);
    console.log(`User ${socket.id} joined game ${gameId}`);
  });
  socket.on("make_move", (data) => {
    socket.to(data.gameId).emit("opponent_moved", data.move);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ROBUST SANITIZATION FOR PRIVATE KEY
let privateKey = process.env.PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
// Remove any whitespace, newlines, or quotes that might have been injected
privateKey = privateKey.replace(/\s/g, "").replace(/["']/g, "").trim();

if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
}

const signer = new ethers.Wallet(privateKey);
console.log("Backend Signer Address:", signer.address);

app.post("/api/resolve-game", async (req, res) => {
  try {
    const { gameId, winner, isDraw } = req.body;
    if (!gameId) return res.status(400).json({ error: "Missing gameId" });
    const messageHash = ethers.solidityPackedKeccak256(
      ["string", "address", "bool"],
      [gameId, winner || ethers.ZeroAddress, isDraw || false]
    );
    const signature = await signer.signMessage(ethers.getBytes(messageHash));
    res.json({ gameId, winner: winner || ethers.ZeroAddress, isDraw: isDraw || false, signature });
  } catch (err) {
    console.error("Error signing message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Web3 Chess Backend running on port ${PORT}`);
});