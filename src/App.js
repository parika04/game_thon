import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

const ROOM_ID = 'room1';
const PLAYER_ID = prompt('Enter your Player ID:');

function App() {
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    socket.emit('joinRoom', { roomId: ROOM_ID, playerId: PLAYER_ID });

    socket.on('timerUpdate', (newTime) => {
      setTimer(newTime);
    });

    return () => {
      socket.off('timerUpdate');
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Multiplayer Jigsaw Puzzle (Basic Timer Sync)</h2>
      <div>Room: {ROOM_ID}</div>
      <div>Player: {PLAYER_ID}</div>
      <div style={{ fontSize: '2rem', marginTop: 20 }}>
        Time Remaining: {timer}s
      </div>
    </div>
  );
}

export default App;
