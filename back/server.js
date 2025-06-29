const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('join_room', (username) => {
    users.set(socket.id, username);
    socket.broadcast.emit('user_joined', {
      username,
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString()
    });
    
    // Send current users list to the new user
    const userList = Array.from(users.values());
    socket.emit('users_list', userList);
    
    // Broadcast updated user list to all users
    io.emit('update_users', userList);
    
    console.log(`${username} joined the chat`);
  });

  // Handle chat messages
  socket.on('send_message', (data) => {
    const username = users.get(socket.id);
    if (username) {
      const messageData = {
        username,
        message: data.message,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random() // Simple ID generation
      };
      
      // Send message to all users
      io.emit('receive_message', messageData);
      console.log(`Message from ${username}: ${data.message}`);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      socket.broadcast.emit('user_left', {
        username,
        message: `${username} left the chat`,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast updated user list
      const userList = Array.from(users.values());
      io.emit('update_users', userList);
      
      console.log(`${username} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});