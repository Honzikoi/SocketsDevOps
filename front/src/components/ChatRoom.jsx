import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatRoom.css';

function ChatRoom({ onBack }) {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Use relative path in production (Docker), localhost in development
    const socketUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Welcome message with room list
    newSocket.on('welcome', (data) => {
      setUsername(data.username);
      setRooms(data.rooms);
    });

    // Room list updates
    newSocket.on('rooms_list', (roomList) => {
      setRooms(roomList);
    });

    // Successfully joined a room
    newSocket.on('joined_room', (roomInfo) => {
      setCurrentRoom(roomInfo);
      setMessages([]);
      setMessages([{
        type: 'system',
        message: `Welcome to ${roomInfo.name}!`,
        timestamp: new Date()
      }]);
    });

    // Left a room
    newSocket.on('left_room', () => {
      setCurrentRoom(null);
      setMessages([]);
    });

    // Room created successfully
    newSocket.on('room_created', (data) => {
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomDesc('');
      // Auto-join the created room
      newSocket.emit('join_room', { roomId: data.roomId });
    });

    // Messages
    newSocket.on('receive_message', (data) => {
      setMessages(prev => [...prev, { type: 'message', ...data }]);
    });

    // User events
    newSocket.on('user_joined', (data) => {
      setMessages(prev => [...prev, { type: 'system', ...data, timestamp: new Date() }]);
    });

    newSocket.on('user_left', (data) => {
      setMessages(prev => [...prev, { type: 'system', ...data, timestamp: new Date() }]);
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join_room', { roomId });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave_room');
    }
  };

  const createRoom = (e) => {
    e.preventDefault();
    if (socket && newRoomName.trim()) {
      socket.emit('create_room', {
        name: newRoomName.trim(),
        description: newRoomDesc.trim()
      });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (socket && newMessage.trim() && currentRoom) {
      socket.emit('send_message', { message: newMessage.trim() });
      setNewMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!username) {
    return (
      <div className="chatroom-container">
        <div className="chatroom-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Home
          </button>
          <h2>Chat Rooms</h2>
        </div>
        <div className="connecting">
          <h3>🔗 Connecting to rooms...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="chatroom-container">
      <div className="chatroom-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Home
        </button>
        <h2>{currentRoom ? `Room: ${currentRoom.name}` : 'Chat Rooms'}</h2>
        <div className="user-info">
          <span className="username-display">You: {username}</span>
        </div>
      </div>
      
      <div className="rooms-layout">
        {/* Rooms Sidebar */}
        <div className="rooms-sidebar">
          <div className="sidebar-header">
            <h3>Rooms ({rooms.length})</h3>
            <button 
              className="create-room-btn"
              onClick={() => setShowCreateRoom(true)}
            >
              + Create
            </button>
          </div>
          
          <div className="rooms-list">
            {rooms.map(room => (
              <div 
                key={room.id} 
                className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => joinRoom(room.id)}
              >
                <div className="room-info">
                  <div className="room-name">{room.name}</div>
                  <div className="room-desc">{room.description}</div>
                  <div className="room-stats">
                    👥 {room.userCount} users • by {room.createdBy}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="chat-area">
          {currentRoom ? (
            <>
              <div className="room-header">
                <div className="room-title">
                  <h3>{currentRoom.name}</h3>
                  <p>{currentRoom.description}</p>
                </div>
                <button className="leave-room-btn" onClick={leaveRoom}>
                  Leave Room
                </button>
              </div>
              
              <div className="messages-container">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`message ${msg.type === 'system' ? 'system-message' : 'chat-message'}`}
                  >
                    {msg.type === 'system' ? (
                      <div className="system-text">
                        <span className="timestamp">{formatTime(msg.timestamp)}</span>
                        {msg.message}
                      </div>
                    ) : (
                      <div className="message-content">
                        <div className="message-header">
                          <span className={`username ${msg.username === username ? 'own-message' : ''}`}>
                            {msg.username === username ? 'You' : msg.username}
                          </span>
                          <span className="timestamp">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="message-text">{msg.message}</div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={sendMessage} className="message-form">
                <input
                  type="text"
                  placeholder={`Message ${currentRoom.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  maxLength={500}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="no-room-selected">
              <h3>👈 Select a room to start chatting</h3>
              <p>Choose a room from the sidebar or create a new one!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="modal-overlay" onClick={() => setShowCreateRoom(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Room</h3>
            <form onSubmit={createRoom}>
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                maxLength={50}
                required
                autoFocus
              />
              <textarea
                placeholder="Room description (optional)"
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowCreateRoom(false)}>
                  Cancel
                </button>
                <button type="submit">Create Room</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoom;