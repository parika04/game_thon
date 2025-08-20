import React from 'react';

const PuzzleGame = ({ 
  gridSize, 
  puzzlePieces, 
  puzzleBoard, 
  boardRef, 
  handleMouseDown, 
  handleMouseMove, 
  handleMouseUp, 
  getPieceStyle, 
  getBoardCellStyle 
}) => {
  // Safety check - ensure board is properly initialized
  if (!puzzleBoard || puzzleBoard.length === 0) {
    return (
      <div className="game-container">
        <div>Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div 
      className="game-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="puzzle-board" ref={boardRef}>
        {Array(gridSize).fill(null).map((_, row) => (
          <div key={row} className="board-row">
            {Array(gridSize).fill(null).map((_, col) => (
              <div 
                key={col} 
                className="board-cell"
                style={getBoardCellStyle(row, col)}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="pieces-container">
        {puzzlePieces.filter(piece => !piece.isPlaced).map(piece => (
          <div
            key={piece.id}
            className="puzzle-piece"
            style={getPieceStyle(piece)}
            onMouseDown={(e) => handleMouseDown(e, piece)}
          />
        ))}
      </div>
    </div>
  );
};

export default PuzzleGame;
