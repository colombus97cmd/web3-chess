import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ChessGame({ isPlayer1, socket, gameId }) {
  const [game, setGame] = useState(new Chess());

  useEffect(() => {
    if (!socket) return;
    
    socket.on('opponent_moved', (move) => {
      // Make the move received from opponent
      const gameCopy = new Chess(game.fen());
      try {
        gameCopy.move(move);
        setGame(gameCopy);
      } catch(e) {
        console.error("Invalid move from opponent:", e);
      }
    });

    return () => {
      socket.off('opponent_moved');
    };
  }, [socket, game, gameId]);

  function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      setGame(gameCopy);
      return result;
    } catch(e) {
      return null;
    }
  }

  function onDrop(sourceSquare, targetSquare) {
    const movePayload = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to a queen for simplicity
    };

    const move = makeAMove(movePayload);

    // illegal move
    if (move === null) return false;
    
    // Broadcast the move to the opponent via Socket.io
    if (socket && gameId) {
      socket.emit('make_move', { gameId, move: movePayload });
    }

    return true;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ color: '#f3ba2f' }}>Interactive Chess Board</h2>
      <div style={{ border: '4px solid #f3ba2f', borderRadius: '4px', padding: '10px', backgroundColor: '#2c2f33' }}>
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop} 
          boardOrientation={isPlayer1 ? "white" : "black"}
          customDarkSquareStyle={{ backgroundColor: '#779556' }}
          customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
        />
      </div>
      <div style={{ marginTop: '20px' }}>
        {game.isGameOver() && (
          <h3 style={{ color: 'red' }}>
            Game Over! 
            {game.isCheckmate() ? " Checkmate!" : " Draw!"}
          </h3>
        )}
      </div>
    </div>
  );
}
