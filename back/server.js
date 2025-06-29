const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
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

// In-memory storage for rooms and users
const rooms = new Map(); // roomId -> room info
const users = new Map(); // socketId -> user info

// Helper function to generate random usernames
function generateRandomUsername() {
  const adjectives = ['Happy', 'Funny', 'Cool', 'Smart', 'Brave', 'Kind', 'Swift', 'Bright'];
  const animals = ['Cat', 'Dog', 'Bear', 'Fox', 'Wolf', 'Lion', 'Tiger', 'Eagle'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 100);
  
  return `${adjective} ${animal} ${number}`;
}

// Helper function to get room info
function getRoomInfo(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  // Count users in this room
  const usersInRoom = Array.from(users.values()).filter(user => user.currentRoom === roomId);
  
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
  for (const roomId of rooms.keys()) {
    roomList.push(getRoomInfo(roomId));
  }
  return roomList.sort((a, b) => b.userCount - a.userCount); // Sort by user count
}

// Create default room
const defaultRoomId = 'general';
rooms.set(defaultRoomId, {
  name: 'General Chat',
  description: 'Main chat room for everyone',
  createdBy: 'System',
  createdAt: new Date()
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const username = generateRandomUsername();
  
  // Store user info
  users.set(socket.id, {
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

  // Handle getting room list
  socket.on('get_rooms', () => {
    socket.emit('rooms_list', getAllRooms());
  });

  // Handle creating a new room
  socket.on('create_room', (data) => {
    const { name, description } = data;
    const user = users.get(socket.id);
    
    if (!user || !name) return;
    
    // Generate room ID
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Create room
    rooms.set(roomId, {
      name: name,
      description: description || '',
      createdBy: user.username,
      createdAt: new Date()
    });
    
    console.log(`🏠 ${user.username} created room: ${name}`);
    
    // Send updated room list to everyone
    io.emit('rooms_list', getAllRooms());
    
    // Automatically join the creator to the new room
    socket.emit('room_created', { roomId: roomId });
  });

  // Handle joining a room
  socket.on('join_room', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    
    if (!user || !rooms.has(roomId)) return;
    
    // Leave current room if any
    if (user.currentRoom) {
      socket.leave(user.currentRoom);
      socket.to(user.currentRoom).emit('user_left', {
        username: user.username,
        message: `${user.username} left the room`
      });
    }
    
    // Join new room
    socket.join(roomId);
    user.currentRoom = roomId;
    
    console.log(`🚪 ${user.username} joined room: ${roomId}`);
    
    // Send room info to user
    const roomInfo = getRoomInfo(roomId);
    socket.emit('joined_room', roomInfo);
    
    // Notify others in the room
    socket.to(roomId).emit('user_joined', {
      username: user.username,
      message: `${user.username} joined the room`
    });
    
    // Update room list for everyone (user count changed)
    io.emit('rooms_list', getAllRooms());
  });

  // Handle sending messages in a room
  socket.on('send_message', (data) => {
    const { message } = data;
    const user = users.get(socket.id);
    
    if (!user || !user.currentRoom || !message) return;
    
    const messageData = {
      id: Date.now() + Math.random(),
      username: user.username,
      message: message,
      timestamp: new Date().toISOString(),
      roomId: user.currentRoom
    };
    
    // Send message to everyone in the room
    io.to(user.currentRoom).emit('receive_message', messageData);
    
    console.log(`💬 [${user.currentRoom}] ${user.username}: ${message}`);
  });

  // Handle leaving a room
  socket.on('leave_room', () => {
    const user = users.get(socket.id);
    
    if (!user || !user.currentRoom) return;
    
    const roomId = user.currentRoom;
    socket.leave(roomId);
    
    // Notify others
    socket.to(roomId).emit('user_left', {
      username: user.username,
      message: `${user.username} left the room`
    });
    
    user.currentRoom = null;
    
    console.log(`🚪 ${user.username} left room: ${roomId}`);
    
    // Update room list for everyone
    io.emit('rooms_list', getAllRooms());
    
    // Send updated room list to the user
    socket.emit('left_room');
    socket.emit('rooms_list', getAllRooms());
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    
    if (user) {
      // Leave current room if any
      if (user.currentRoom) {
        socket.to(user.currentRoom).emit('user_left', {
          username: user.username,
          message: `${user.username} disconnected`
        });
      }
      
      console.log(`❌ ${user.username} disconnected`);
      users.delete(socket.id);
      
      // Update room list for everyone
      io.emit('rooms_list', getAllRooms());
    }
  });
});

// REST API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    totalRooms: rooms.size,
    totalUsers: users.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/rooms', (req, res) => {
  res.json(getAllRooms());
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server with rooms running on port ${PORT}`);
  console.log(`📊 Default room "${defaultRoomId}" created`);
  console.log(`🌐 Server ready to accept connections`);
  
  // Test that we can receive requests
  console.log(`💡 Test the server: curl http://localhost:${PORT}/health`);
});