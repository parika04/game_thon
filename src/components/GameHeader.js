import React from 'react';

const GameHeader = ({ roomId, playerName, timer }) => {
  return (
    <div className="header">
      <h1>Multiplayer Jigsaw Puzzle</h1>
      <div className="game-info">
        <div>Room: {roomId}</div>
        <div>Player: {playerName}</div>
        <div className="timer">
          Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
