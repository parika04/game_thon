import { useState, useEffect, useRef } from 'react';

// Sample puzzle image (you can replace with any image URL)
const PUZZLE_IMAGE = 'https://picsum.photos/400/300';

export const usePuzzle = (gameState, gridSize = 3) => {
  const [puzzlePieces, setPuzzlePieces] = useState([]);
  const [puzzleBoard, setPuzzleBoard] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef(null);

  // Initialize puzzle pieces
  useEffect(() => {
    if (gameState === 'playing') {
      initializePuzzle();
    }
  }, [gameState, gridSize]);

  const initializePuzzle = () => {
    const pieces = [];
    const totalPieces = gridSize * gridSize;
    
    for (let i = 0; i < totalPieces; i++) {
      pieces.push({
        id: i,
        correctPosition: i,
        currentPosition: i,
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100) + 100,
        isPlaced: false
      });
    }
    
    // Shuffle pieces
    const shuffledPieces = pieces.sort(() => Math.random() - 0.5);
    setPuzzlePieces(shuffledPieces);
    
    // Initialize empty board with proper structure
    const board = [];
    for (let row = 0; row < gridSize; row++) {
      board[row] = [];
      for (let col = 0; col < gridSize; col++) {
        board[row][col] = null;
      }
    }
    setPuzzleBoard(board);
    
    console.log('Puzzle initialized with board:', board);
  };

  const handleMouseDown = (e, piece) => {
    if (gameState !== 'playing') return;
    
    setIsDragging(true);
    setSelectedPiece(piece);
    const rect = e.target.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedPiece) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setPuzzlePieces(prev => prev.map(piece => 
      piece.id === selectedPiece.id ? { ...piece, x: newX, y: newY } : piece
    ));
  };

  const handleMouseUp = (e, socket, roomId, playerName) => {
    if (!isDragging || !selectedPiece) return;
    
    setIsDragging(false);
    
    // Check if piece is near correct position on board
    if (boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const pieceSize = 400 / gridSize;
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const cellX = boardRect.left + col * pieceSize;
          const cellY = boardRect.top + row * pieceSize;
          
          if (Math.abs(e.clientX - cellX) < pieceSize / 2 && 
              Math.abs(e.clientY - cellY) < pieceSize / 2) {
            
            // Check if this is the correct position for this piece
            if (selectedPiece.correctPosition === row * gridSize + col) {
              // Place piece correctly
              setPuzzlePieces(prev => prev.map(piece => 
                piece.id === selectedPiece.id ? { ...piece, isPlaced: true } : piece
              ));
              
              setPuzzleBoard(prev => {
                const newBoard = prev.map(row => [...row]);
                newBoard[row][col] = selectedPiece.id;
                return newBoard;
              });
              
              // Check if puzzle is complete
              const updatedPieces = puzzlePieces.map(piece => 
                piece.id === selectedPiece.id ? { ...piece, isPlaced: true } : piece
              );
              
              if (updatedPieces.every(piece => piece.isPlaced)) {
                socket.emit('puzzleComplete', { roomId, playerId: playerName });
              }
            }
            break;
          }
        }
      }
    }
    
    setSelectedPiece(null);
  };

  const getPieceStyle = (piece) => {
    const pieceSize = 400 / gridSize;
    const row = Math.floor(piece.correctPosition / gridSize);
    const col = piece.correctPosition % gridSize;
    
    return {
      width: pieceSize,
      height: pieceSize,
      backgroundImage: `url(${PUZZLE_IMAGE})`,
      backgroundSize: `${400}px ${300}px`,
      backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
      border: piece.isPlaced ? '2px solid #4CAF50' : '1px solid #ccc',
      cursor: isDragging && selectedPiece?.id === piece.id ? 'grabbing' : 'grab',
      position: 'absolute',
      left: piece.x,
      top: piece.y,
      zIndex: selectedPiece?.id === piece.id ? 1000 : 1,
      transition: piece.isPlaced ? 'all 0.3s ease' : 'none'
    };
  };

  const getBoardCellStyle = (row, col) => {
    const pieceSize = 400 / gridSize;
    
    // Check if puzzleBoard[row] exists before accessing it
    if (!puzzleBoard[row] || puzzleBoard[row][col] === undefined) {
      return {
        width: pieceSize,
        height: pieceSize,
        border: '1px solid #ccc',
        backgroundColor: '#f9f9f9'
      };
    }
    
    const pieceId = puzzleBoard[row][col];
    const piece = puzzlePieces.find(p => p.id === pieceId);
    
    if (piece) {
      const pieceRow = Math.floor(piece.correctPosition / gridSize);
      const pieceCol = piece.correctPosition % gridSize;
      
      return {
        width: pieceSize,
        height: pieceSize,
        backgroundImage: `url(${PUZZLE_IMAGE})`,
        backgroundSize: `${400}px ${300}px`,
        backgroundPosition: `-${pieceCol * pieceSize}px -${pieceRow * pieceSize}px`,
        border: '1px solid #333',
        backgroundColor: '#f0f0f0'
      };
    }
    
    return {
      width: pieceSize,
      height: pieceSize,
      border: '1px solid #ccc',
      backgroundColor: '#f9f9f9'
    };
  };

  return {
    puzzlePieces,
    setPuzzlePieces,
    puzzleBoard,
    selectedPiece,
    isDragging,
    boardRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getPieceStyle,
    getBoardCellStyle
  };
};
