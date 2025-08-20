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
			socket.off('availableRooms');
			socket.off('roomJoined');
			socket.off('playerJoined');
			socket.off('playerLeft');
			socket.off('gameComplete');
			socket.off('roomJoinError');
		};
	}, [playerName, setAvailableRooms, setRoomId, setPlayersInRoom, setIsHost, setGameState, setTimer, setPuzzlePieces, setGridSize, setImageSrc]);

	return socket;
};
