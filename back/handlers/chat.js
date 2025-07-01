/**
 * Chat Handler - Manages all chat-related Socket.IO events
 */

function chatHandler(socket, io, sharedData, helpers) {
  const { getRoomInfo, getAllRooms } = helpers;

  // Handle getting room list
  socket.on('get_rooms', () => {
    socket.emit('rooms_list', getAllRooms());
  });

  // Handle creating a new room
  socket.on('create_room', (data) => {
    const { name, description } = data;
    const user = sharedData.users.get(socket.id);
    
    if (!user || !name) return;
    
    // Generate room ID
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Create room
    sharedData.rooms.set(roomId, {
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
    const user = sharedData.users.get(socket.id);
    
    if (!user || !sharedData.rooms.has(roomId)) return;
    
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
    const user = sharedData.users.get(socket.id);
    
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
    const user = sharedData.users.get(socket.id);
    
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
}

module.exports = chatHandler;