import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { createWeb3Modal, defaultConfig, useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';
import ChessGame from './components/ChessGame';
import TrialMode from './components/TrialMode';
import io from 'socket.io-client';

// Using the contract data exported from deployment
import contractData from '../contractData.json';

// Initialize socket connection to backend
// In production, VITE_BACKEND_URL is set in Netlify environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(BACKEND_URL);

// Project ID from environment variable
// Users can create their own at cloud.walletconnect.com
const projectId = import.meta.env.VITE_PROJECT_ID || '3f8b030fcad077ab94bc6cde3cfc5c4e';

// Configure BNB Chain
const bscMainnet = {
  chainId: 56,
  name: 'BNB Smart Chain',
  currency: 'BNB',
  explorerUrl: 'https://bscscan.com',
  rpcUrl: 'https://bsc-dataseed.binance.org/'
};

const bscTestnet = {
  chainId: 97,
  name: 'BNB Smart Chain Testnet',
  currency: 'tBNB',
  explorerUrl: 'https://testnet.bscscan.com',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545'
};

const localhost = {
  chainId: 31337,
  name: 'Localhost (Anvil)',
  currency: 'ETH',
  explorerUrl: 'http://localhost:8545',
  rpcUrl: 'http://127.0.0.1:8545'
};

const metadata = {
  name: 'Web3 Chess',
  description: 'Play Chess and wager BNB with global players securely on chain.',
  url: 'http://localhost:5173', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [localhost, bscTestnet, bscMainnet],
  projectId,
  enableAnalytics: true
});

function App() {
  const { address, chainId, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  
  const [contract, setContract] = useState(null);
  const [gameId, setGameId] = useState("");
  const [isPlayer1, setIsPlayer1] = useState(true);
  const [gameActive, setGameActive] = useState(false);

  useEffect(() => {
    if (isConnected && walletProvider) {
      const initContract = async () => {
        try {
          const ethersProvider = new ethers.BrowserProvider(walletProvider);
          const signer = await ethersProvider.getSigner();
          const _contract = new ethers.Contract(contractData.address, contractData.abi, signer);
          setContract(_contract);
        } catch(e) {
          console.error("Error setting up contract:", e);
        }
      };
      initContract();
    } else {
      setContract(null);
    }
  }, [isConnected, walletProvider]);

  const createGame = async () => {
    if (!contract || !gameId) return;
    try {
      const wagerAmount = ethers.parseEther("0.01"); // Example wager amount in BNB
      const tx = await contract.createGame(gameId, { value: wagerAmount });
      await tx.wait();
      
      // Join socket room
      socket.emit('join_game', gameId);
      setIsPlayer1(true);
      setGameActive(true);
      alert("Game created successfully! Waiting for opponent...");
    } catch (err) {
      console.error(err);
      alert("Error creating game");
    }
  };

  const joinGame = async () => {
    if (!contract || !gameId) return;
    try {
      const wagerAmount = ethers.parseEther("0.01"); // Example wager
      const tx = await contract.joinGame(gameId, { value: wagerAmount });
      await tx.wait();
      
      // Join socket room
      socket.emit('join_game', gameId);
      setIsPlayer1(false);
      setGameActive(true);
      alert("Joined game securely! Match starting soon.");
    } catch (err) {
      console.error(err);
      alert("Error joining game");
    }
  };

  const resolveGame = async (winner, isDraw) => {
    if (!isConnected) return;
    try {
      const res = await fetch('http://localhost:3001/api/resolve-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, winner, isDraw })
      });
      
      const data = await res.json();
      
      const tx = await contract.resolveGame(data.gameId, data.winner, data.isDraw, data.signature);
      await tx.wait();
      
      alert("Game securely resolved on-chain! Payout sent.");
    } catch (err) {
      console.error(err);
      alert("Failed to resolve game");
    }
  };

  // --- Tab state: 'trial' or 'real' ---
  const [activeTab, setActiveTab] = useState('trial');

  const focusRealMode = () => setActiveTab('real');

  const tabStyle = (tab) => ({
    padding: '10px 28px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    background: activeTab === tab
      ? (tab === 'trial' ? '#2ecc71' : '#f3ba2f')
      : '#2c2f36',
    color: activeTab === tab ? (tab === 'trial' ? '#000' : '#000') : '#888',
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>Web3 BNB Chess</h1>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '24px', justifyContent: 'center' }}>
          <button style={tabStyle('trial')} onClick={() => setActiveTab('trial')}>
            🎮 Mode Essai Gratuit
          </button>
          <button style={tabStyle('real')} onClick={() => setActiveTab('real')}>
            💰 Jouer pour de vrais BNB
          </button>
        </div>

        {/* Tab content container */}
        <div style={{
          border: `2px solid ${activeTab === 'trial' ? '#2ecc71' : '#f3ba2f'}`,
          borderRadius: '0 12px 12px 12px',
          padding: '28px',
          marginTop: '0',
          background: '#1a1d23',
          minWidth: 'min(560px, 90vw)',
          transition: 'border-color 0.3s',
        }}>

          {/* Trial Mode Tab */}
          {activeTab === 'trial' && (
            <TrialMode onConnectWallet={focusRealMode} />
          )}

          {/* Real Game Tab */}
          {activeTab === 'real' && (
            <div>
              {/* Web3Modal UI Connect Button */}
              <div style={{ margin: '0 0 20px', textAlign: 'center' }}>
                <w3m-button balance="show" />
              </div>

              {!isConnected && (
                <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                  👆 Connectez votre wallet pour créer ou rejoindre une partie avec mise en BNB.
                </p>
              )}

              {isConnected && (
                <div>
                  <div className="game-controls">
                    <input
                      type="text"
                      placeholder="Entrez un ID de partie"
                      value={gameId}
                      onChange={e => setGameId(e.target.value)}
                    />
                    <button onClick={createGame}>Créer une partie (0.01 BNB)</button>
                    <button onClick={joinGame}>Rejoindre une partie (0.01 BNB)</button>
                  </div>

                  <hr style={{ margin: '30px 0', borderColor: '#444' }} />

                  {gameActive && (
                    <ChessGame isPlayer1={isPlayer1} socket={socket} gameId={gameId} />
                  )}

                  <div className="admin-controls" style={{marginTop: '2rem', padding: '1rem', border: '1px solid #444', borderRadius: '10px'}}>
                    <p>Simuler la résolution de partie (demo)</p>
                    <button style={{backgroundColor: '#4CAF50', color: 'white'}} onClick={() => resolveGame(address, false)}>J'ai gagné</button>
                    <button style={{backgroundColor: '#607d8b', color: 'white'}} onClick={() => resolveGame(ethers.ZeroAddress, true)}>Match nul</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;

