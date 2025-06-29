import { useState, useEffect } from 'react';
import './GameRoom.css';

function GameRoom({ socket, username, currentRoom, users = [] }) {
  const [gameState, setGameState] = useState('lobby'); // lobby, playing, results, finished
  const [isReady, setIsReady] = useState(false);
  const [readyPlayers, setReadyPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [scores, setScores] = useState({});
  const [gameResults, setGameResults] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Sample questions - in real app, load from API/JSON
  const sampleQuestions = [
    {
      id: 1,
      question: "What is the capital of France?",
      answers: ["London", "Berlin", "Paris", "Madrid"],
      correct: 2,
      points: 100
    },
    {
      id: 2,
      question: "Which planet is closest to the Sun?",
      answers: ["Venus", "Mercury", "Earth", "Mars"],
      correct: 1,
      points: 100
    },
    {
      id: 3,
      question: "What year did the Titanic sink?",
      answers: ["1910", "1912", "1914", "1916"],
      correct: 1,
      points: 100
    },
    {
      id: 4,
      question: "Who painted the Mona Lisa?",
      answers: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
      correct: 2,
      points: 100
    },
    {
      id: 5,
      question: "What is the largest ocean on Earth?",
      answers: ["Atlantic", "Indian", "Arctic", "Pacific"],
      correct: 3,
      points: 100
    }
  ];

  useEffect(() => {
    if (!socket) return;

    // Game event listeners
    socket.on('player_ready', (data) => {
      setReadyPlayers(data.readyPlayers);
    });

    socket.on('game_started', (data) => {
      setGameState('playing');
      setQuestions(data.questions);
      setCurrentQuestion(data.questions[0]);
      setQuestionIndex(0);
      setTimeLeft(15);
      setScores(data.scores);
    });

    socket.on('next_question', (data) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTimeLeft(15);
      setSelectedAnswer(null);
      setGameResults(null);
    });

    socket.on('question_results', (data) => {
      setGameResults(data);
      setScores(data.scores);
    });

    socket.on('game_finished', (data) => {
      setGameState('finished');
      setGameResults(data);
      setScores(data.finalScores);
    });

    socket.on('game_reset', () => {
      setGameState('lobby');
      setIsReady(false);
      setReadyPlayers([]);
      setCurrentQuestion(null);
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setScores({});
      setGameResults(null);
    });

    return () => {
      socket.off('player_ready');
      socket.off('game_started');
      socket.off('next_question');
      socket.off('question_results');
      socket.off('game_finished');
      socket.off('game_reset');
    };
  }, [socket]);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, timeLeft]);

  const toggleReady = () => {
    if (!socket) return;
    
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    socket.emit('toggle_ready', {
      ready: newReadyState,
      roomId: currentRoom?.id
    });
  };

  const selectAnswer = (answerIndex) => {
    if (selectedAnswer !== null || timeLeft === 0) return;
    
    setSelectedAnswer(answerIndex);
    
    if (socket && currentQuestion) {
      socket.emit('submit_answer', {
        questionId: currentQuestion.id,
        answerIndex: answerIndex,
        timeLeft: timeLeft,
        roomId: currentRoom?.id
      });
    }
  };

  const startNewGame = () => {
    if (socket) {
      socket.emit('start_game', {
        roomId: currentRoom?.id,
        questions: sampleQuestions
      });
    }
  };

  const resetGame = () => {
    if (socket) {
      socket.emit('reset_game', {
        roomId: currentRoom?.id
      });
    }
  };

  if (!currentRoom) {
    return (
      <div className="game-room">
        <div className="game-placeholder">
          <h3>🎮 Game Room</h3>
          <p>Join a chat room to start playing games!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-room">
      <div className="game-header">
        <h3>🎮 Trivia Game</h3>
        <div className="game-info">
          Room: {currentRoom.name}
        </div>
      </div>

      {/* Lobby State */}
      {gameState === 'lobby' && (
        <div className="game-lobby">
          <div className="lobby-status">
            <h4>Get Ready to Play!</h4>
            <p>Players: {users.length} • Ready: {readyPlayers.length}</p>
          </div>

          <div className="ready-section">
            <button 
              className={`ready-btn ${isReady ? 'ready' : ''}`}
              onClick={toggleReady}
            >
              {isReady ? '✅ Ready!' : '⏳ Click when Ready'}
            </button>
          </div>

          <div className="players-list">
            <h5>Players:</h5>
            {users.map((user, index) => (
              <div key={index} className="player-item">
                <span className="player-name">{user === username ? 'You' : user}</span>
                <span className={`player-status ${readyPlayers.includes(user) ? 'ready' : 'waiting'}`}>
                  {readyPlayers.includes(user) ? '✅' : '⏳'}
                </span>
              </div>
            ))}
          </div>

          {users.length > 0 && readyPlayers.length === users.length && (
            <div className="start-game">
              <button className="start-btn" onClick={startNewGame}>
                🚀 Start Game!
              </button>
            </div>
          )}
        </div>
      )}

      {/* Playing State */}
      {gameState === 'playing' && currentQuestion && (
        <div className="game-playing">
          <div className="question-header">
            <div className="question-progress">
              Question {questionIndex + 1} of {questions.length}
            </div>
            <div className="timer">
              ⏱️ {timeLeft}s
            </div>
          </div>

          <div className="question-text">
            {currentQuestion.question}
          </div>

          <div className="answers-grid">
            {currentQuestion.answers.map((answer, index) => (
              <button
                key={index}
                className={`answer-btn ${selectedAnswer === index ? 'selected' : ''} ${
                  gameResults && index === currentQuestion.correct ? 'correct' : ''
                } ${
                  gameResults && selectedAnswer === index && index !== currentQuestion.correct ? 'wrong' : ''
                }`}
                onClick={() => selectAnswer(index)}
                disabled={selectedAnswer !== null || timeLeft === 0}
              >
                <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                <span className="answer-text">{answer}</span>
              </button>
            ))}
          </div>

          {gameResults && (
            <div className="question-results">
              <h4>Results:</h4>
              <p>Correct answer: {currentQuestion.answers[currentQuestion.correct]}</p>
              <div className="mini-leaderboard">
                {Object.entries(scores)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([player, score], index) => (
                    <div key={player} className="score-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="player">{player === username ? 'You' : player}</span>
                      <span className="score">{score} pts</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finished State */}
      {gameState === 'finished' && (
        <div className="game-finished">
          <h3>🏆 Game Over!</h3>
          
          <div className="final-leaderboard">
            <h4>Final Scores:</h4>
            {Object.entries(scores)
              .sort(([,a], [,b]) => b - a)
              .map(([player, score], index) => (
                <div key={player} className={`leaderboard-item ${index === 0 ? 'winner' : ''}`}>
                  <span className="rank">
                    {index === 0 ? '👑' : `#${index + 1}`}
                  </span>
                  <span className="player">{player === username ? 'You' : player}</span>
                  <span className="score">{score} pts</span>
                </div>
              ))}
          </div>

          <div className="game-actions">
            <button className="play-again-btn" onClick={resetGame}>
              🔄 Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameRoom;