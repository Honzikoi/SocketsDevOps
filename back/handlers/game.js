/**
 * Game Handler - Manages all game-related Socket.IO events
 */

const { getDB } = require('../db');

function gameHandler(socket, io, sharedData) {
  
  // Handle player ready toggle
  socket.on('toggle_ready', (data) => {
    const user = sharedData.users.get(socket.id);
    if (!user || !user.currentRoom) return;
    
    const { ready, roomId } = data;
    
    if (!sharedData.readyPlayers.has(roomId)) {
      sharedData.readyPlayers.set(roomId, new Set());
    }
    
    const roomReadyPlayers = sharedData.readyPlayers.get(roomId);
    
    if (ready) {
      roomReadyPlayers.add(user.username);
    } else {
      roomReadyPlayers.delete(user.username);
    }
    
    // Send updated ready list to room
    io.to(roomId).emit('player_ready', {
      readyPlayers: Array.from(roomReadyPlayers)
    });
    
    console.log(`🎮 ${user.username} ${ready ? 'ready' : 'not ready'} in ${roomId}`);
  });

  // Handle game start
  socket.on('start_game', (data) => {
    const user = sharedData.users.get(socket.id);
    if (!user || !user.currentRoom) return;
    
    const { roomId, questions } = data;
    const roomReadyPlayers = sharedData.readyPlayers.get(roomId) || new Set();
    
    // Initialize game state
    const gameState = {
      questions: questions,
      currentQuestionIndex: 0,
      scores: {},
      answers: {},
      questionStartTime: Date.now(),
      timers: []
    };
    
    // Initialize scores for all ready players
    roomReadyPlayers.forEach(username => {
      gameState.scores[username] = 0;
    });
    
    sharedData.games.set(roomId, gameState);
    
    // Start the game
    io.to(roomId).emit('game_started', {
      questions: questions,
      scores: gameState.scores
    });
    
    console.log(`🎮 Game started in ${roomId} with ${roomReadyPlayers.size} players`);
    
    // Auto-advance question after 17 seconds (15s + 2s buffer)
    const timer = setTimeout(() => {
      showQuestionResults(roomId, io, sharedData);
    }, 17000);
    
    gameState.timers.push(timer);
  });

  // Handle answer submission
  socket.on('submit_answer', (data) => {
    const user = sharedData.users.get(socket.id);
    if (!user || !user.currentRoom) return;
    
    const { questionId, answerIndex, timeLeft, roomId } = data;
    const game = sharedData.games.get(roomId);
    
    if (!game || game.answers[user.username]) return; // Already answered
    
    game.answers[user.username] = {
      answerIndex,
      timeLeft,
      timestamp: Date.now()
    };
    
    console.log(`🎮 ${user.username} answered question ${questionId} with option ${answerIndex}`);
  });

  socket.on('save_score', async ({ username, points }) => {
    try {
      const db = getDB();
      await db.run("INSERT INTO scores (username, points) VALUES (?, ?)", [username, points]);
      socket.emit('score_saved');
    } catch (err) {
      console.error("❌ Error saving score:", err);
      socket.emit('error', { message: 'Erreur enregistrement score' });
    }
  });

  socket.on('get_scores', async () => {
    try {
      const db = getDB();
      const scores = await db.all("SELECT username, points, played_at FROM scores ORDER BY points DESC LIMIT 10");
      socket.emit('score_list', scores);
    } catch (err) {
      console.error("❌ Error fetching scores:", err);
      socket.emit('error', { message: 'Erreur récupération classement' });
    }
  });


  // Handle game reset
  socket.on('reset_game', (data) => {
    const { roomId } = data;
    
    // Clear timers
    const game = sharedData.games.get(roomId);
    if (game && game.timers) {
      game.timers.forEach(timer => clearTimeout(timer));
    }
    
    // Clear game state
    sharedData.games.delete(roomId);
    sharedData.readyPlayers.delete(roomId);
    
    // Notify all players
    io.to(roomId).emit('game_reset');
    
    console.log(`🎮 Game reset in ${roomId}`);
  });
}

// Helper function to show question results and advance game
function showQuestionResults(roomId, io, sharedData) {
  const game = sharedData.games.get(roomId);
  if (!game) return;
  
  const currentQuestion = game.questions[game.currentQuestionIndex];
  const correctAnswer = currentQuestion.correct;
  
  // Calculate scores
  Object.entries(game.answers).forEach(([username, answer]) => {
    if (answer.answerIndex === correctAnswer) {
      // Bonus points for speed (more time left = more points)
      const speedBonus = Math.floor(answer.timeLeft * 2);
      game.scores[username] += currentQuestion.points + speedBonus;
    }
  });
  
  // Send results
  io.to(roomId).emit('question_results', {
    correctAnswer,
    scores: game.scores,
    answers: game.answers
  });
  
  // Move to next question or end game
  const nextTimer = setTimeout(() => {
    game.currentQuestionIndex++;
    game.answers = {}; // Reset answers for next question
    
    if (game.currentQuestionIndex < game.questions.length) {
      // Next question
      const nextQuestion = game.questions[game.currentQuestionIndex];
      io.to(roomId).emit('next_question', {
        question: nextQuestion,
        questionIndex: game.currentQuestionIndex
      });
      
      // Auto-advance next question
      const questionTimer = setTimeout(() => {
        showQuestionResults(roomId, io, sharedData);
      }, 17000);
      
      game.timers.push(questionTimer);
    } else {
      // Game finished
      const sortedScores = Object.entries(game.scores).sort(([,a], [,b]) => b - a);
      const winner = sortedScores[0];
      
      io.to(roomId).emit('game_finished', {
        finalScores: game.scores,
        winner: winner
      });
      
      console.log(`🎮 Game finished in ${roomId}. Winner: ${winner[0]} with ${winner[1]} points`);
    }
  }, 5000); // Show results for 5 seconds
  
  game.timers.push(nextTimer);
}

module.exports = gameHandler;