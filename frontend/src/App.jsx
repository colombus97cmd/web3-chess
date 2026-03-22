import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import { createWeb3Modal, defaultConfig, useWeb3ModalProvider, useWeb3ModalAccount } from "@web3modal/ethers/react";
import ChessGame from "./components/ChessGame";
import TrialMode from "./components/TrialMode";
import io from "socket.io-client";
import contractData from "../contractData.json";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(BACKEND_URL);
const projectId = import.meta.env.VITE_PROJECT_ID || "3f8b030fcad077ab94bc6cde3cfc5c4e";

const bscMainnet = { chainId: 56, name: "BNB Smart Chain", currency: "BNB", explorerUrl: "https://bscscan.com", rpcUrl: "https://bsc-dataseed.binance.org/" };
const bscTestnet = { chainId: 97, name: "BNB Smart Chain Testnet", currency: "tBNB", explorerUrl: "https://testnet.bscscan.com", rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545" };
const localhost = { chainId: 31337, name: "Localhost (Anvil)", currency: "ETH", explorerUrl: "http://localhost:8545", rpcUrl: "http://127.0.0.1:8545" };

const metadata = { name: "Web3 Chess", description: "Play Chess and wager BNB with global players securely on chain.", url: "https://web3-chess-ten.vercel.app", icons: ["https://avatars.githubusercontent.com/u/37784886"] };

createWeb3Modal({ ethersConfig: defaultConfig({ metadata }), chains: [localhost, bscTestnet, bscMainnet], projectId, enableAnalytics: true });

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
        } catch(e) { console.error("Error setting up contract:", e); }
      };
      initContract();
    } else { setContract(null); }
  }, [isConnected, walletProvider]);

  const createGame = async () => {
    if (!contract || !gameId) return;
    try {
      const wagerAmount = ethers.parseEther("0.01");
      const tx = await contract.createGame(gameId, { value: wagerAmount });
      await tx.wait();
      socket.emit("join_game", gameId);
      setIsPlayer1(true);
      setGameActive(true);
      alert("Game created successfully!");
    } catch (err) { console.error(err); alert("Error creating game"); }
  };

  const joinGame = async () => {
    if (!contract || !gameId) return;
    try {
      const wagerAmount = ethers.parseEther("0.01");
      const tx = await contract.joinGame(gameId, { value: wagerAmount });
      await tx.wait();
      socket.emit("join_game", gameId);
      setIsPlayer1(false);
      setGameActive(true);
      alert("Joined game securely!");
    } catch (err) { console.error(err); alert("Error joining game"); }
  };

  const resolveGame = async (winner, isDraw) => {
    if (!isConnected) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/resolve-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, winner, isDraw })
      });
      const data = await res.json();
      const tx = await contract.resolveGame(data.gameId, data.winner, data.isDraw, data.signature);
      await tx.wait();
      alert("Game securely resolved!");
    } catch (err) { console.error(err); alert("Failed to resolve game"); }
  };

  const [activeTab, setActiveTab] = useState("trial");
  const tabStyle = (tab) => ({
    padding: "10px 28px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
    background: activeTab === tab ? (tab === "trial" ? "#2ecc71" : "#f3ba2f") : "#2c2f36",
    color: "#000", fontWeight: "bold"
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>Web3 BNB Chess</h1>
        <div style={{ display: "flex", gap: "4px", marginTop: "24px", justifyContent: "center" }}>
          <button style={tabStyle("trial")} onClick={() => setActiveTab("trial")}>Mode Essai Gratuit</button>
          <button style={tabStyle("real")} onClick={() => setActiveTab("real")}>Jouer pour de vrais BNB</button>
        </div>
        <div style={{ border: `2px solid ${activeTab === "trial" ? "#2ecc71" : "#f3ba2f"}`, borderRadius: "0 12px 12px 12px", padding: "28px", background: "#1a1d23", minWidth: "min(560px, 90vw)" }}>
          {activeTab === "trial" && <TrialMode onConnectWallet={() => setActiveTab("real")} />}
          {activeTab === "real" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}><w3m-button balance="show" /></div>
              {!isConnected && <p style={{ color: "#888", textAlign: "center" }}>Connectez votre wallet.</p>}
              {isConnected && (
                <div>
                  <div className="game-controls">
                    <input type="text" placeholder="ID de partie" value={gameId} onChange={e => setGameId(e.target.value)} />
                    <button onClick={createGame}>CrÃ©er</button>
                    <button onClick={joinGame}>Rejoindre</button>
                  </div>
                  {gameActive && <ChessGame isPlayer1={isPlayer1} socket={socket} gameId={gameId} />}
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