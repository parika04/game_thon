import { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

export const useSocket = ({
	setAvailableRooms,
	setRoomId,
	setPlayersInRoom,
	setIsHost,
	setGameState,
	setTimer,
	setPuzzlePieces,
	setPuzzleBoard,
	playerName,
	setGridSize,
	setImageSrc
}) => {
	useEffect(() => {
		socket.on('timerUpdate', (newTime) => {
			setTimer(newTime);
			if (newTime <= 0) {
				setGameState('completed');
			}
		});

		socket.on('gameStart', (settings) => {
			// settings: { gridSize, imageSrc }
			if (settings?.gridSize) setGridSize(settings.gridSize);
			if (settings?.imageSrc) setImageSrc(settings.imageSrc);
			setGameState('playing');
		});

		socket.on('pieceMoved', ({ pieceId, x, y, playerId }) => {
			if (playerId !== playerName) {
				setPuzzlePieces((prev) => prev.map((piece) => (piece.id === pieceId ? { ...piece, x, y } : piece)));
			}
		});

		// Sync placements from other players
		socket.on('piecePlaced', ({ pieceId, row, col, playerId }) => {
			if (playerId !== playerName) {
				setPuzzlePieces((prev) => prev.map((p) => (p.id === pieceId ? { ...p, isPlaced: true } : p)));
				setPuzzleBoard((prev) => {
					const next = prev.map(r => [...r]);
					next[row][col] = pieceId;
					return next;
				});
			}
		});

		socket.on('availableRooms', (rooms) => {
			setAvailableRooms(rooms);
		});

		socket.on('roomJoined', ({ roomId, players, isHost: hostStatus }) => {
			setRoomId(roomId);
			setPlayersInRoom(players);
			setIsHost(hostStatus);
			setGameState('waiting');
		});

		socket.on('playerJoined', ({ players }) => {
			setPlayersInRoom(players);
		});

		socket.on('playerLeft', ({ players }) => {
			setPlayersInRoom(players);
		});

		socket.on('gameComplete', () => {
			setGameState('completed');
		});

		socket.on('roomJoinError', (message) => {
			alert(message);
			// Ask again for available rooms
			socket.emit('getAvailableRooms');
		});

		// Request available rooms on component mount
		socket.emit('getAvailableRooms');

		return () => {
			socket.off('timerUpdate');
			socket.off('gameStart');
			socket.off('pieceMoved');
			socket.off('piecePlaced');
			socket.off('availableRooms');
			socket.off('roomJoined');
			socket.off('playerJoined');
			socket.off('playerLeft');
			socket.off('gameComplete');
			socket.off('roomJoinError');
		};
	}, [playerName, setAvailableRooms, setRoomId, setPlayersInRoom, setIsHost, setGameState, setTimer, setPuzzlePieces, setPuzzleBoard, setGridSize, setImageSrc]);

	return socket;
};
