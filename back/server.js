const { connectToDatabase, getDB } = require('./db');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const chatHandler = require('./handlers/chat');
const gameHandler = require('./handlers/game');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

console.log('🚀 Starting server...');

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

console.log('✅ Socket.IO configured');

// Middleware
app.use(cors());
app.use(express.json());

console.log('✅ Middleware configured');

// Shared data storage
const sharedData = {
  rooms: new Map(),
  users: new Map(),
  games: new Map(),
  readyPlayers: new Map()
};

// Helper function to generate random usernames
function generateRandomUsername() {
  const adjectives = ['Happy', 'Funny', 'Cool', 'Smart', 'Brave', 'Kind', 'Swift', 'Bright'];
  const animals = ['Cat', 'Dog', 'Bear', 'Fox', 'Wolf', 'Lion', 'Tiger', 'Eagle'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 100);
  
  return `${adjective}${animal}${number}`;
}

// Helper function to get room info
function getRoomInfo(roomId) {
  const room = sharedData.rooms.get(roomId);
  if (!room) return null;
  
  const usersInRoom = Array.from(sharedData.users.values()).filter(user => user.currentRoom === roomId);
  
  return {
    id: roomId,
    name: room.name,
    description: room.description,
    createdBy: room.createdBy,
    createdAt: room.createdAt,
    userCount: usersInRoom.length,
    users: usersInRoom.map(user => user.username)
  };
}

// Helper function to get all rooms
function getAllRooms() {
  const roomList = [];
  for (const roomId of sharedData.rooms.keys()) {
    roomList.push(getRoomInfo(roomId));
  }
  return roomList.sort((a, b) => b.userCount - a.userCount);
}

// Create default room
const defaultRoomId = 'general';
sharedData.rooms.set(defaultRoomId, {
  name: 'General Chat',
  description: 'Main chat room for everyone',
  createdBy: 'System',
  createdAt: new Date()
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const username = generateRandomUsername();
  
  // Store user info
  sharedData.users.set(socket.id, {
    username: username,
    currentRoom: null,
    joinedAt: new Date()
  });
  
  console.log(`🔗 ${username} connected (${socket.id})`);
  
  // Send welcome and room list
  socket.emit('welcome', {
    username: username,
    rooms: getAllRooms()
  });

  // Initialize chat and game handlers
  chatHandler(socket, io, sharedData, { getRoomInfo, getAllRooms });
  gameHandler(socket, io, sharedData);

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = sharedData.users.get(socket.id);
    if (user) {
      // Leave current room if any
      if (user.currentRoom) {
        socket.to(user.currentRoom).emit('user_left', {
          username: user.username,
          message: `${user.username} disconnected`
        });
        
        // Remove from ready players
        const roomReadyPlayers = sharedData.readyPlayers.get(user.currentRoom);
        if (roomReadyPlayers) {
          roomReadyPlayers.delete(user.username);
        }
      }
      
      console.log(`❌ ${user.username} disconnected`);
      sharedData.users.delete(socket.id);
      
      // Update room list for everyone
      io.emit('rooms_list', getAllRooms());
    }
  });
});

// REST API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    totalRooms: sharedData.rooms.size,
    totalUsers: sharedData.users.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/rooms', (req, res) => {
  res.json(getAllRooms());
});

app.get('/api/scores', async (req, res) => {
  try {
    const db = getDB();
    const scores = await db.all("SELECT username, points, played_at FROM scores ORDER BY points DESC LIMIT 10");
    res.json(scores);
  } catch (err) {
    console.error("❌ Error fetching scores:", err);
    res.status(500).json({ error: 'Erreur récupération scores' });
  }
});


const PORT = process.env.PORT || 3001;

connectToDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server with rooms running on port ${PORT}`);
    console.log(`📊 Default room "${defaultRoomId}" created`);
    console.log(`🌐 Server ready to accept connections`);
    console.log(`💡 Test the server: curl http://localhost:${PORT}/health`);
  });
}).catch((err) => {
  console.error("❌ Failed to init DB", err);
});