import { useState, useEffect, useRef } from 'react';

export const usePuzzle = (gameState, gridSize = 3, imageSrc = 'https://picsum.photos/800/600') => {
  const [puzzlePieces, setPuzzlePieces] = useState([]);
  const [puzzleBoard, setPuzzleBoard] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef(null);
  const [boardSize, setBoardSize] = useState({ width: 400, height: 300 });

  // Compute board size based on image dimensions while maintaining aspect ratio
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const maxWidth = 500; // render width cap for consistency
      const aspectRatio = img.height / img.width;
      const width = maxWidth;
      const height = Math.round(width * aspectRatio);
      setBoardSize({ width, height });
    };
    img.src = imageSrc;
  }, [imageSrc]);

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
      const boardElement = boardRef.current;
      const boardRect = boardElement.getBoundingClientRect();
      const computed = window.getComputedStyle(boardElement);
      const paddingLeft = parseFloat(computed.paddingLeft) || 0;
      const paddingTop = parseFloat(computed.paddingTop) || 0;
      const originX = boardRect.left + paddingLeft;
      const originY = boardRect.top + paddingTop;
      const pieceWidth = boardSize.width / gridSize;
      const pieceHeight = boardSize.height / gridSize;

      // Cursor position relative to the board content
      const localX = e.clientX - originX;
      const localY = e.clientY - originY;

      // Check if cursor is within the board area
      if (localX >= 0 && localY >= 0 && localX <= boardSize.width && localY <= boardSize.height) {
        const col = Math.floor(localX / pieceWidth);
        const row = Math.floor(localY / pieceHeight);
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          // Ensure target cell is empty
          const isOccupied = puzzleBoard[row] && puzzleBoard[row][col] !== null;
          if (!isOccupied) {
            // Only allow placing on the correct cell
            if (selectedPiece.correctPosition === row * gridSize + col) {
              // Place piece correctly
              setPuzzlePieces(prev => prev.map(piece => 
                piece.id === selectedPiece.id ? { ...piece, isPlaced: true } : piece
              ));

              setPuzzleBoard(prev => {
                const newBoard = prev.map(r => [...r]);
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
          }
        }
      }
    }
    
    setSelectedPiece(null);
  };

  const getPieceStyle = (piece) => {
    const pieceWidth = boardSize.width / gridSize;
    const pieceHeight = boardSize.height / gridSize;
    const row = Math.floor(piece.correctPosition / gridSize);
    const col = piece.correctPosition % gridSize;
    
    return {
      width: pieceWidth,
      height: pieceHeight,
      backgroundImage: `url(${imageSrc})`,
      backgroundSize: `${boardSize.width}px ${boardSize.height}px`,
      backgroundPosition: `-${col * pieceWidth}px -${row * pieceHeight}px`,
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
    const pieceWidth = boardSize.width / gridSize;
    const pieceHeight = boardSize.height / gridSize;
    
    // Check if puzzleBoard[row] exists before accessing it
    if (!puzzleBoard[row] || puzzleBoard[row][col] === undefined) {
      return {
        width: pieceWidth,
        height: pieceHeight,
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
        width: pieceWidth,
        height: pieceHeight,
        backgroundImage: `url(${imageSrc})`,
        backgroundSize: `${boardSize.width}px ${boardSize.height}px`,
        backgroundPosition: `-${pieceCol * pieceWidth}px -${pieceRow * pieceHeight}px`,
        border: '1px solid #333',
        backgroundColor: '#f0f0f0'
      };
    }
    
    return {
      width: pieceWidth,
      height: pieceHeight,
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
    dragOffset,
    boardRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getPieceStyle,
    getBoardCellStyle
  };
};
