const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 4000;

let rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ roomId, playerId }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { timer: 300, players: new Set() };
    }
    rooms[roomId].players.add(playerId);
    io.to(roomId).emit('timerUpdate', rooms[roomId].timer);
    console.log(`Player ${playerId} joined room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Optional: handle leaving rooms if you track players by socket.id
  });
});

setInterval(() => {
  for (const roomId in rooms) {
    if (rooms[roomId].timer > 0) {
      rooms[roomId].timer--;
      io.to(roomId).emit('timerUpdate', rooms[roomId].timer);
    }
  }
}, 1000);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
