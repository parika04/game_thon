import React, { useState } from 'react';
import './App.css';

// Components
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import PuzzleGame from './components/PuzzleGame';
import GameHeader from './components/GameHeader';
import GameComplete from './components/GameComplete';

// Hooks
import { useSocket } from './hooks/useSocket';
import { usePuzzle } from './hooks/usePuzzle';

function App() {
  // Game state
  const [gameState, setGameState] = useState('lobby'); // lobby, waiting, playing, completed
  const [timer, setTimer] = useState(300);
  const [gridSize, setGridSize] = useState(3); // dynamic grid size
  const [imageSrc, setImageSrc] = useState('https://picsum.photos/800/600');
  
  // Lobby state
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [playersInRoom, setPlayersInRoom] = useState([]);

  // Puzzle hook
  const {
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
  } = usePuzzle(gameState, gridSize, imageSrc);

  // Socket hook
  const socket = useSocket({
    setAvailableRooms,
    setRoomId,
    setPlayersInRoom,
    setIsHost,
    setGameState,
    setTimer,
    setPuzzlePieces,
    playerName,
    setGridSize,
    setImageSrc
  });

  // Room management functions
  const createRoom = () => {
    console.log('Create room clicked, playerName:', playerName);
    if (!playerName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    console.log('Emitting createRoom event with playerName:', playerName);
    socket.emit('createRoom', { playerName });
  };

  const joinRoom = (roomId) => {
    if (!playerName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    socket.emit('joinRoom', { roomId, playerName });
  };

  const startGame = () => {
    console.log('Start game clicked');
    console.log('isHost:', isHost);
    console.log('roomId:', roomId);
    if (isHost) {
      console.log('Emitting startGame event with roomId:', roomId);
      socket.emit('startGame', { roomId, gridSize, imageSrc });
    } else {
      console.log('Not host, cannot start game');
    }
  };

  const leaveRoom = () => {
    socket.emit('leaveRoom', { roomId, playerName });
    setGameState('lobby');
    setRoomId('');
    setPlayersInRoom([]);
    setIsHost(false);
  };

  // Enhanced mouse handlers for puzzle
  const handlePuzzleMouseMove = (e) => {
    if (!isDragging || !selectedPiece) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setPuzzlePieces(prev => prev.map(piece => 
      piece.id === selectedPiece.id ? { ...piece, x: newX, y: newY } : piece
    ));

    socket.emit('movePiece', { 
      roomId, 
      pieceId: selectedPiece.id, 
      x: newX, 
      y: newY, 
      playerId: playerName 
    });
  };

  const handlePuzzleMouseUp = (e) => {
    handleMouseUp(e, socket, roomId, playerName);
  };

  // Render different components based on game state
  if (gameState === 'lobby') {
    return (
      <div className="App">
        <GameHeader roomId="" playerName="" timer={timer} />
        <Lobby 
          playerName={playerName}
          setPlayerName={setPlayerName}
          availableRooms={availableRooms}
          createRoom={createRoom}
          joinRoom={joinRoom}
        />
      </div>
    );
  }

  return (
    <div 
      className="App"
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <GameHeader 
        roomId={roomId} 
        playerName={playerName} 
        timer={timer} 
      />

      {gameState === 'waiting' && (
        <WaitingRoom 
          playersInRoom={playersInRoom}
          playerName={playerName}
          isHost={isHost}
          startGame={startGame}
          leaveRoom={leaveRoom}
          gridSize={gridSize}
          setGridSize={setGridSize}
          imageSrc={imageSrc}
          setImageSrc={setImageSrc}
        />
      )}

      {gameState === 'playing' && (
        <PuzzleGame 
          gridSize={gridSize}
          puzzlePieces={puzzlePieces}
          puzzleBoard={puzzleBoard}
          boardRef={boardRef}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handlePuzzleMouseMove}
          handleMouseUp={handlePuzzleMouseUp}
          getPieceStyle={getPieceStyle}
          getBoardCellStyle={getBoardCellStyle}
        />
      )}

      {gameState === 'completed' && (
        <GameComplete timer={timer} />
      )}
    </div>
  );
}

export default App;
