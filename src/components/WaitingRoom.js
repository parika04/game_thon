import React, { useRef, useState } from 'react';

const WaitingRoom = ({ 
  playersInRoom, 
  playerName, 
  isHost, 
  startGame, 
  leaveRoom,
  gridSize,
  setGridSize,
  imageSrc,
  setImageSrc
}) => {
  const fileInputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState(imageSrc || '');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setLocalPreview(dataUrl);
      // Set immediately for host; will be broadcast on start
      setImageSrc(typeof dataUrl === 'string' ? dataUrl : '');

      // Auto-suggest grid size based on image resolution
      if (typeof dataUrl === 'string') {
        const img = new Image();
        img.onload = () => {
          const pixels = img.width * img.height;
          let suggested = 3;
          if (pixels > 1200000) suggested = 6; // >1.2MP
          else if (pixels > 600000) suggested = 5; // >0.6MP
          else if (pixels > 300000) suggested = 4; // >0.3MP
          else suggested = 3;
          setGridSize(suggested);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDifficultyChange = (e) => {
    const value = e.target.value;
    const numeric = parseInt(value, 10);
    setGridSize(Number.isFinite(numeric) ? numeric : 3);
  };
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
        <>
          <div style={{ marginBottom: 20 }}>
            <h3>Choose Image</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
              <button className="create-button" onClick={() => fileInputRef.current?.click()}>Upload Image</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button className="join-button" onClick={() => { setImageSrc('https://picsum.photos/800/600'); setLocalPreview('https://picsum.photos/800/600'); }}>Use Default</button>
            </div>
            {localPreview && (
              <div style={{ marginTop: 12 }}>
                <img src={localPreview} alt="Preview" style={{ maxWidth: 300, maxHeight: 200, borderRadius: 8 }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3>Difficulty</h3>
            <select value={gridSize} onChange={handleDifficultyChange} style={{ padding: '8px 12px', borderRadius: 8 }}>
              <option value={3}>Easy (3 x 3)</option>
              <option value={4}>Normal (4 x 4)</option>
              <option value={5}>Hard (5 x 5)</option>
              <option value={6}>Expert (6 x 6)</option>
            </select>
          </div>

          <button onClick={startGame} className="start-button">
            Start Game
          </button>
        </>
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
