import React from 'react';

const Lobby = ({ 
  playerName, 
  setPlayerName, 
  availableRooms, 
  createRoom, 
  joinRoom 
}) => {
  return (
    <div className="lobby-container">
      <div className="player-setup">
        <h2>Enter Your Name</h2>
        <input
          type="text"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="name-input"
          maxLength={20}
        />
      </div>

      <div className="room-actions">
        <div className="create-room">
          <h3>Create New Room</h3>
          <button onClick={createRoom} className="create-button">
            Create Room
          </button>
        </div>

        <div className="join-room">
          <h3>Join Existing Room</h3>
          <div className="available-rooms">
            {availableRooms.length === 0 ? (
              <p>No rooms available. Create one!</p>
            ) : (
              availableRooms.map(room => (
                <div key={room.id} className="room-item">
                  <span>Room: {room.id}</span>
                  <span>Players: {room.players.length}/4</span>
                  <button 
                    onClick={() => joinRoom(room.id)} 
                    className="join-button"
                    disabled={room.players.length >= 4}
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
