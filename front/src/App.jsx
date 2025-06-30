import { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const HomePage = () => (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to ChatApp</h1>
        <p>Join rooms, chat with friends, and have fun!</p>
        
        <div className="button-group">
          <button 
            className="nav-button chat-button"
            onClick={() => setCurrentPage('rooms')}
          >
            🏠 Browse Rooms
          </button>
        </div>
      </div>
      
      <div className="features">
        <div className="feature-card">
          <h3>Chat Rooms</h3>
          <p>Join different rooms and chat with people who share your interests</p>
        </div>
        <div className="feature-card">
          <h3>Create Rooms</h3>
          <p>Start your own room and invite others to join the conversation</p>
        </div>
      </div>
    </div>
  );

  const DataPage = () => (
    <div className="page-container">
      <div className="page-header">
        <button 
          className="back-button"
          onClick={() => setCurrentPage('home')}
        >
          ← Back to Home
        </button>
        <h2>API Data Dashboard</h2>
      </div>
      
      <div className="content-box">
        <div className="placeholder-content">
          <h3>📊 Data Coming Soon</h3>
          <p>API integration will be added here...</p>
        </div>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'rooms':
        return <ChatRoom onBack={() => setCurrentPage('home')} />;
      case 'data':
        return <DataPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app">
      {renderCurrentPage()}
    </div>
  );
}

export default App;