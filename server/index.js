const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = 4000;

let rooms = {};
// Map sockets to { roomId, playerName }
const socketToPlayer = new Map();

// Generate a random room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('getAvailableRooms', () => {
    const availableRooms = Object.keys(rooms).map(roomId => ({
      id: roomId,
      players: Array.from(rooms[roomId].players),
      gameState: rooms[roomId].gameState
    })).filter(room => room.gameState === 'waiting');
    
    socket.emit('availableRooms', availableRooms);
  });

  socket.on('createRoom', ({ playerName }) => {
    const roomId = generateRoomId();
    rooms[roomId] = { 
      timer: 300, 
      players: new Set([playerName]),
      gameState: 'waiting',
      pieces: [],
      board: [],
      host: playerName
    };
    
    socket.join(roomId);
    socketToPlayer.set(socket.id, { roomId, playerName });
    
    socket.emit('roomJoined', { 
      roomId, 
      players: [playerName], 
      isHost: true 
    });
    
    // Update available rooms for all clients
    io.emit('availableRooms', Object.keys(rooms).map(roomId => ({
      id: roomId,
      players: Array.from(rooms[roomId].players),
      gameState: rooms[roomId].gameState
    })).filter(room => room.gameState === 'waiting'));
    
    console.log(`Room ${roomId} created by ${playerName}`);
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    if (rooms[roomId] && rooms[roomId].gameState === 'waiting') {
      if (rooms[roomId].players.size >= 4) {
        socket.emit('roomJoinError', 'Room is full');
        return;
      }
      
      rooms[roomId].players.add(playerName);
      socket.join(roomId);
      socketToPlayer.set(socket.id, { roomId, playerName });
      
      const playersArray = Array.from(rooms[roomId].players);
      socket.emit('roomJoined', { 
        roomId, 
        players: playersArray, 
        isHost: false 
      });
      
      // Notify other players in the room
      socket.to(roomId).emit('playerJoined', { 
        playerName, 
        players: playersArray 
      });
      
      // Update available rooms for all clients
      io.emit('availableRooms', Object.keys(rooms).map(roomId => ({
        id: roomId,
        players: Array.from(rooms[roomId].players),
        gameState: rooms[roomId].gameState
      })).filter(room => room.gameState === 'waiting'));
      
      console.log(`Player ${playerName} joined room ${roomId}`);
    } else {
      socket.emit('roomJoinError', 'Room not found or game already started');
    }
  });

  socket.on('leaveRoom', ({ roomId, playerName }) => {
    if (rooms[roomId]) {
      rooms[roomId].players.delete(playerName);
      socket.leave(roomId);
      socketToPlayer.delete(socket.id);
      
      const playersArray = Array.from(rooms[roomId].players);
      
      // Notify other players in the room
      socket.to(roomId).emit('playerLeft', { 
        playerName, 
        players: playersArray 
      });
      
      // If room is empty, delete it
      if (rooms[roomId].players.size === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted (empty)`);
      }
      
      // Update available rooms for all clients
      io.emit('availableRooms', Object.keys(rooms).map(roomId => ({
        id: roomId,
        players: Array.from(rooms[roomId].players),
        gameState: rooms[roomId].gameState
      })).filter(room => room.gameState === 'waiting'));
      
      console.log(`Player ${playerName} left room ${roomId}`);
    }
  });

  socket.on('startGame', ({ roomId }) => {
    console.log(`Attempting to start game in room ${roomId}`);
    if (rooms[roomId]) {
      rooms[roomId].gameState = 'playing';
      rooms[roomId].timer = 300;
      io.to(roomId).emit('gameStart');
      
      // Update available rooms for all clients
      io.emit('availableRooms', Object.keys(rooms).map(roomId => ({
        id: roomId,
        players: Array.from(rooms[roomId].players),
        gameState: rooms[roomId].gameState
      })).filter(room => room.gameState === 'waiting'));
      
      console.log(`Game started in room ${roomId}`);
    } else {
      console.log(`Room ${roomId} not found when trying to start game`);
    }
  });

  socket.on('movePiece', ({ roomId, pieceId, x, y, playerId }) => {
    if (rooms[roomId]) {
      // Broadcast piece movement to other players in the room
      socket.to(roomId).emit('pieceMoved', { pieceId, x, y, playerId });
    }
  });

  socket.on('puzzleComplete', ({ roomId, playerId }) => {
    if (rooms[roomId]) {
      rooms[roomId].gameState = 'completed';
      io.to(roomId).emit('gameComplete', { playerId });
      console.log(`Puzzle completed by ${playerId} in room ${roomId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;
    
    const { roomId, playerName } = mapping;
    socketToPlayer.delete(socket.id);

    if (!rooms[roomId]) return;
    rooms[roomId].players.delete(playerName);

    const playersArray = Array.from(rooms[roomId].players);
    socket.to(roomId).emit('playerLeft', { 
      playerName, 
      players: playersArray 
    });

    if (rooms[roomId].players.size === 0) {
      delete rooms[roomId];
      console.log(`Room ${roomId} deleted (empty)`);
    }

    io.emit('availableRooms', Object.keys(rooms).map(roomId => ({
      id: roomId,
      players: Array.from(rooms[roomId].players),
      gameState: rooms[roomId].gameState
    })).filter(room => room.gameState === 'waiting'));
  });
});

// Timer countdown for all active games
setInterval(() => {
  for (const roomId in rooms) {
    if (rooms[roomId].gameState === 'playing' && rooms[roomId].timer > 0) {
      rooms[roomId].timer--;
      io.to(roomId).emit('timerUpdate', rooms[roomId].timer);
      
      if (rooms[roomId].timer <= 0) {
        rooms[roomId].gameState = 'completed';
        io.to(roomId).emit('gameComplete', { playerId: 'Time Up' });
      }
    }
  }
}, 1000);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
