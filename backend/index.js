import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();

// Restrict CORS in production — ALLOWED_ORIGIN is set in Railway env vars
// Falls back to all origins in local dev
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// Health check for Railway uptime monitoring
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  }
});

// Socket.io logic for game rooms
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_game', (gameId) => {
    socket.join(gameId);
    console.log(`User ${socket.id} joined game ${gameId}`);
  });

  socket.on('make_move', (data) => {
    // data should contain { gameId, move }
    socket.to(data.gameId).emit('opponent_moved', data.move);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// In production, this must be a securely stored secret key
// Replace this with your actual environment variable PRIVATE_KEY
const privateKey = (process.env.PRIVATE_KEY || "").replace(/\\s/g, "") || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const signer = new ethers.Wallet(privateKey);

console.log("Backend Signer Address:", signer.address);

app.post('/api/resolve-game', async (req, res) => {
  try {
    const { gameId, winner, isDraw } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: "Missing gameId" });
    }
    
    // Convert to exactly how Solidity packages it: string, address, bool
    const messageHash = ethers.solidityPackedKeccak256(
      ["string", "address", "bool"],
      [gameId, winner || ethers.ZeroAddress, isDraw || false]
    );

    // Sign the hash (ethers automatically applies the Ethereum Signed Message prefix)
    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    res.json({
      gameId,
      winner: winner || ethers.ZeroAddress,
      isDraw: isDraw || false,
      signature
    });
  } catch (err) {
    console.error("Error signing message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Web3 Chess Backend with Socket.io running on port ${PORT}`);
});
