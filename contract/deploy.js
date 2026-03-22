import fs from "fs";
import { ethers } from "ethers";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  // RPC_URL env var controls where the contract is deployed
  // Local:       http://127.0.0.1:8545  (Anvil)
  // BNB Testnet: https://data-seed-prebsc-1-s1.binance.org:8545
  // BNB Mainnet: https://bsc-dataseed.binance.org/
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // DEPLOYER_PRIVATE_KEY and BACKEND_SIGNER_ADDRESS come from .env
  // NEVER commit .env to git — use .env.example as a template
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY
    || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const backendSignerAddress = process.env.BACKEND_SIGNER_ADDRESS
    || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const wallet = new ethers.Wallet(deployerPrivateKey, provider);

  console.log("Deploying contract with account:", wallet.address);

  // Read compiled artifact from Foundry
  const artifactPath = path.resolve("./out/ChessWager.sol/ChessWager.json");
  if (!fs.existsSync(artifactPath)) {
    console.error("Compiled contract not found. Run 'forge build' first.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode.object, wallet);
  
  const contract = await factory.deploy(backendSignerAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ChessWager deployed to:", address);

  // Save the address and ABI for frontend/backend
  const frontendPath = path.resolve("../frontend/contractData.json");
  const data = {
    address: address,
    abi: artifact.abi
  };
  
  fs.mkdirSync("../frontend", { recursive: true });
  fs.writeFileSync(frontendPath, JSON.stringify(data, null, 2));
  console.log("Contract data saved to frontend:", frontendPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
