import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

// --- Constants ---
const DAILY_TRIAL_LIMIT = 3;
const HYPOTHETICAL_WAGER_BNB = 0.05; // The "what if" wager shown to users
const BNB_PRICE_USD = 600; // Approximate BNB price for display

// --- LocalStorage helpers ---
function getTrialData() {
  try {
    const raw = localStorage.getItem('chess_trial');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getRemainingTrials() {
  const data = getTrialData();
  const today = new Date().toDateString();
  if (!data || data.date !== today) return DAILY_TRIAL_LIMIT;
  return Math.max(0, DAILY_TRIAL_LIMIT - (data.count || 0));
}

function consumeTrial() {
  const data = getTrialData();
  const today = new Date().toDateString();
  if (!data || data.date !== today) {
    localStorage.setItem('chess_trial', JSON.stringify({ date: today, count: 1 }));
  } else {
    localStorage.setItem('chess_trial', JSON.stringify({ date: today, count: data.count + 1 }));
  }
}

// --- Result Modal ---
function ResultModal({ result, hypotheticalGain, onClose, onPlayAgain, trialsLeft }) {
  const isWin = result === 'win';
  const isDraw = result === 'draw';
  const gainUSD = (hypotheticalGain * BNB_PRICE_USD).toFixed(2);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1d23 0%, #2c2f36 100%)',
        border: `2px solid ${isWin ? '#f3ba2f' : isDraw ? '#888' : '#e74c3c'}`,
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '440px',
        width: '90%',
        textAlign: 'center',
        boxShadow: `0 0 60px ${isWin ? '#f3ba2f44' : '#e74c3c44'}`,
      }}>
        {/* Result Icon */}
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>
          {isWin ? '🏆' : isDraw ? '🤝' : '💀'}
        </div>

        <h2 style={{ color: isWin ? '#f3ba2f' : isDraw ? '#aaa' : '#e74c3c', fontSize: '28px', margin: '0 0 8px' }}>
          {isWin ? 'Victoire !' : isDraw ? 'Match nul !' : 'Défaite !'}
        </h2>
        <p style={{ color: '#aaa', marginBottom: '28px', fontSize: '14px' }}>
          Partie d'essai — Aucun BNB réel en jeu
        </p>

        {/* Hypothetical earnings */}
        <div style={{
          background: 'rgba(243,186,47,0.08)',
          border: '1px solid rgba(243,186,47,0.3)',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '28px',
        }}>
          <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            💡 Si vous aviez misé {HYPOTHETICAL_WAGER_BNB} BNB...
          </p>
          {isWin ? (
            <>
              <div style={{ color: '#f3ba2f', fontSize: '36px', fontWeight: 'bold' }}>
                +{(HYPOTHETICAL_WAGER_BNB * 2 * 0.98).toFixed(4)} BNB
              </div>
              <div style={{ color: '#27ae60', fontSize: '18px', marginTop: '4px' }}>
                ≈ +${(HYPOTHETICAL_WAGER_BNB * 2 * 0.98 * BNB_PRICE_USD).toFixed(2)} USD
              </div>
              <p style={{ color: '#666', fontSize: '11px', marginTop: '8px' }}>
                (après 2% de frais de service)
              </p>
            </>
          ) : isDraw ? (
            <>
              <div style={{ color: '#aaa', fontSize: '28px', fontWeight: 'bold' }}>
                ±0.00 BNB
              </div>
              <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                Votre mise vous aurait été remboursée intégralement.
              </p>
            </>
          ) : (
            <>
              <div style={{ color: '#e74c3c', fontSize: '36px', fontWeight: 'bold' }}>
                -{HYPOTHETICAL_WAGER_BNB} BNB
              </div>
              <div style={{ color: '#c0392b', fontSize: '18px', marginTop: '4px' }}>
                ≈ -${(HYPOTHETICAL_WAGER_BNB * BNB_PRICE_USD).toFixed(2)} USD
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #f3ba2f22, #f3ba2f11)',
          border: '1px solid #f3ba2f55',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <p style={{ color: '#f3ba2f', fontWeight: 'bold', margin: '0 0 8px', fontSize: '15px' }}>
            🚀 Prêt à gagner de vrais BNB ?
          </p>
          <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
            Connectez votre wallet et misez de vrais BNB pour gagner réellement !
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {trialsLeft > 0 && (
            <button onClick={onPlayAgain} style={{
              background: '#2c2f36',
              color: '#ccc',
              border: '1px solid #555',
              borderRadius: '10px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              🎮 Rejouer ({trialsLeft} essai{trialsLeft > 1 ? 's' : ''} restant{trialsLeft > 1 ? 's' : ''})
            </button>
          )}
          <button onClick={onClose} style={{
            background: 'linear-gradient(135deg, #f3ba2f, #e0a800)',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            💰 Connecter mon Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main TrialMode component ---
export default function TrialMode({ onConnectWallet }) {
  const [trialsLeft, setTrialsLeft] = useState(getRemainingTrials());
  const [gameStarted, setGameStarted] = useState(false);
  const [game, setGame] = useState(new Chess());
  const [result, setResult] = useState(null); // 'win' | 'lose' | 'draw'
  const [showModal, setShowModal] = useState(false);

  // Check game-over after every move
  useEffect(() => {
    if (game.isGameOver() && !showModal) {
      let res = 'draw';
      if (game.isCheckmate()) {
        // In single-player trial mode vs AI (random), figure out who won
        // White always plays as the trial user
        res = game.turn() === 'b' ? 'win' : 'lose';
      }
      setResult(res);
      setShowModal(true);
    }
  }, [game, showModal]);

  function startTrial() {
    if (trialsLeft <= 0) return;
    consumeTrial();
    setTrialsLeft(getRemainingTrials());
    setGame(new Chess());
    setResult(null);
    setShowModal(false);
    setGameStarted(true);
  }

  function onPlayAgain() {
    setShowModal(false);
    setGameStarted(false);
  }

  function onDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess(game.fen());
    try {
      gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      setGame(gameCopy);

      // Simple AI: after user moves, make a random legal move for opponent
      if (!gameCopy.isGameOver()) {
        const moves = gameCopy.moves();
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          const aICopy = new Chess(gameCopy.fen());
          aICopy.move(randomMove);
          setGame(aICopy);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  // --- Render: No trials left ---
  if (trialsLeft === 0 && !gameStarted) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 20px',
        border: '1px solid #444', borderRadius: '16px',
        background: '#1a1d23',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h3 style={{ color: '#f3ba2f', marginBottom: '8px' }}>3 parties d'essai utilisées aujourd'hui !</h3>
        <p style={{ color: '#888', marginBottom: '24px' }}>
          Revenez demain pour 3 nouvelles parties gratuites — ou connectez votre wallet pour jouer sans limite et gagner de vrais BNB !
        </p>
        <button onClick={onConnectWallet} style={{
          background: 'linear-gradient(135deg, #f3ba2f, #e0a800)',
          color: '#000', border: 'none', borderRadius: '10px',
          padding: '14px 28px', cursor: 'pointer',
          fontSize: '15px', fontWeight: 'bold',
        }}>
          🔗 Connecter mon Wallet
        </button>
      </div>
    );
  }

  // --- Render: Landing screen ---
  if (!gameStarted) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 20px',
        border: '1px dashed #f3ba2f44', borderRadius: '16px',
        background: 'linear-gradient(135deg, #1a1d23 0%, #1e2128 100%)',
      }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>♟️</div>
        <h2 style={{ color: '#f3ba2f', margin: '0 0 8px' }}>Mode Essai Gratuit</h2>
        <p style={{ color: '#aaa', marginBottom: '8px', maxWidth: '380px', margin: '0 auto 24px' }}>
          Jouez <strong style={{ color: '#fff' }}>3 parties gratuites par jour</strong> contre une IA et découvrez combien vous auriez pu gagner en jouant pour de vrai !
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[...Array(DAILY_TRIAL_LIMIT)].map((_, i) => (
            <div key={i} style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: i < trialsLeft ? '#f3ba2f' : '#333',
              border: `2px solid ${i < trialsLeft ? '#f3ba2f' : '#555'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>
              {i < trialsLeft ? '🎮' : '✓'}
            </div>
          ))}
        </div>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>
          {trialsLeft} partie{trialsLeft > 1 ? 's' : ''} d'essai restante{trialsLeft > 1 ? 's' : ''} aujourd'hui
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={startTrial} style={{
            background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '14px 32px', cursor: 'pointer',
            fontSize: '15px', fontWeight: 'bold',
          }}>
            🎮 Lancer une partie d'essai
          </button>
          <button onClick={onConnectWallet} style={{
            background: 'linear-gradient(135deg, #f3ba2f, #e0a800)',
            color: '#000', border: 'none', borderRadius: '10px',
            padding: '14px 28px', cursor: 'pointer',
            fontSize: '15px', fontWeight: 'bold',
          }}>
            💰 Jouer pour de vrais BNB
          </button>
        </div>
      </div>
    );
  }

  // --- Render: Active trial game ---
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Trial badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'rgba(46,204,113,0.15)', border: '1px solid #2ecc71',
        borderRadius: '20px', padding: '6px 16px', marginBottom: '20px',
        fontSize: '13px', color: '#2ecc71',
      }}>
        🎮 MODE ESSAI — Aucun BNB en jeu &nbsp;·&nbsp; Mise hypothétique : {HYPOTHETICAL_WAGER_BNB} BNB
      </div>

      <div style={{ border: '4px solid #2ecc71', borderRadius: '8px', padding: '10px', backgroundColor: '#2c2f33', maxWidth: '540px', margin: '0 auto' }}>
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardOrientation="white"
          customDarkSquareStyle={{ backgroundColor: '#779556' }}
          customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
        />
      </div>

      <p style={{ color: '#666', fontSize: '12px', marginTop: '12px' }}>
        Vous jouez les Blancs · L'IA joue les Noirs (coups aléatoires)
      </p>

      {showModal && (
        <ResultModal
          result={result}
          hypotheticalGain={HYPOTHETICAL_WAGER_BNB}
          onClose={onConnectWallet}
          onPlayAgain={onPlayAgain}
          trialsLeft={getRemainingTrials()}
        />
      )}
    </div>
  );
}
