import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for messages
    socket.on('receive_message', (data) => {
      setMessages(prev => [...prev, { ...data, type: 'message' }]);
    });

    // Listen for user events
    socket.on('user_joined', (data) => {
      setMessages(prev => [...prev, { ...data, type: 'system' }]);
    });

    socket.on('user_left', (data) => {
      setMessages(prev => [...prev, { ...data, type: 'system' }]);
    });

    // Listen for users list updates
    socket.on('users_list', (userList) => {
      setUsers(userList);
    });

    socket.on('update_users', (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('users_list');
      socket.off('update_users');
    };
  }, []);

  const joinRoom = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('join_room', username);
      setIsJoined(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('send_message', { message });
      setMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isJoined) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Join Chat Room</h1>
          <form onSubmit={joinRoom}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              required
            />
            <button type="submit">Join Chat</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3>Online Users ({users.length})</h3>
        <div className="users-list">
          {users.map((user, index) => (
            <div key={index} className="user-item">
              <span className="user-indicator">●</span>
              {user}
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-main">
        <div className="chat-header">
          <h2>Chat Room</h2>
          <span className="current-user">Welcome, {username}!</span>
        </div>
        
        <div className="messages-container">
          {messages.map((msg) => (
            <div 
              key={msg.id || msg.timestamp} 
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
                    <span className="username">{msg.username}</span>
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
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;