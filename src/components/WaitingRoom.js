import React from 'react';

const WaitingRoom = ({ 
  playersInRoom, 
  playerName, 
  isHost, 
  startGame, 
  leaveRoom 
}) => {
  return (
    <div className="waiting-screen">
      <h2>Waiting Room</h2>
      <div className="players-list">
        <h3>Players in Room:</h3>
        {playersInRoom.map((player, index) => (
          <div key={index} className="player-item">
            {player} {player === playerName ? '(You)' : ''}
          </div>
        ))}
      </div>
      {isHost && (
        <button onClick={startGame} className="start-button">
          Start Game
        </button>
      )}
      {!isHost && (
        <p>Waiting for host to start the game...</p>
      )}
      <button onClick={leaveRoom} className="leave-button">
        Leave Room
      </button>
    </div>
  );
};

export default WaitingRoom;
