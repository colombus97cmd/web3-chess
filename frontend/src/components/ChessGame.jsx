import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessGame({ isPlayer1, socket, gameId }) {
  const [game, setGame] = useState(new Chess());

  // Listen for moves from the opponent
  useEffect(() => {
    if (!socket) return;
    
    const handleOpponentMove = (move) => {
      setGame((prevGame) => {
        const gameCopy = new Chess(prevGame.fen());
        try {
          gameCopy.move(move);
          return gameCopy;
        } catch (e) {
          console.error("Invalid move from opponent:", e);
          return prevGame;
        }
      });
    };

    socket.on("opponent_moved", handleOpponentMove);
    return () => socket.off("opponent_moved", handleOpponentMove);
  }, [socket]);

  function onDrop(sourceSquare, targetSquare) {
    // 1. Check if it is the current player's turn
    // isPlayer1 is true (White) -> game.turn() must be "w"
    // isPlayer1 is false (Black) -> game.turn() must be "b"
    const turn = game.turn();
    if ((isPlayer1 && turn !== "w") || (!isPlayer1 && turn !== "b")) {
      return false;
    }

    const movePayload = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };

    // 2. Try to make the move locally
    let move = null;
    setGame((prevGame) => {
      const gameCopy = new Chess(prevGame.fen());
      try {
        move = gameCopy.move(movePayload);
        if (move) {
          // 3. If move is legal, broadcast it
          if (socket && gameId) {
            socket.emit("make_move", { gameId, move: movePayload });
          }
          return gameCopy;
        }
      } catch (e) {
        return prevGame;
      }
      return prevGame;
    });

    return move !== null;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <h3 style={{ color: isPlayer1 ? "#fff" : "#f3ba2f" }}>
        Vous jouez les {isPlayer1 ? "Blancs" : "Noirs"}
      </h3>
      <div style={{ border: "4px solid #444", borderRadius: "8px", overflow: "hidden" }}>
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardOrientation={isPlayer1 ? "white" : "black"}
          customDarkSquareStyle={{ backgroundColor: "#779556" }}
          customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
        />
      </div>
      <div style={{ marginTop: "20px" }}>
        {game.isGameOver() && (
          <h3 style={{ color: "#ff4d4d" }}>
            Partie terminée ! 
            {game.isCheckmate() ? " Échec et mat !" : " Match nul !"}
          </h3>
        )}
        <p style={{ color: "#aaa" }}>
          Tour actuel : {game.turn() === "w" ? "Blancs" : "Noirs"}
        </p>
      </div>
    </div>
  );
}