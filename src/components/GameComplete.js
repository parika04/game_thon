import React from 'react';

const GameComplete = ({ timer }) => {
  return (
    <div className="completed-screen">
      <h2>Puzzle Complete!</h2>
      <p>Congratulations! You solved the puzzle in {300 - timer} seconds!</p>
      <button onClick={() => window.location.reload()} className="restart-button">
        Play Again
      </button>
    </div>
  );
};

export default GameComplete;
