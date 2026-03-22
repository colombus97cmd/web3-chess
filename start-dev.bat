@echo off
echo Starting Web3 Chess Local Development Environment...

echo [1/4] Starting Anvil Local Blockchain...
start cmd /k "C:\Users\david\.foundry\bin\anvil.exe"

echo Waiting for Anvil to start...
timeout /t 3 /nobreak > NUL

echo [2/4] Deploying Smart Contract to Anvil...
cd contract
node deploy.js
cd ..

echo [3/4] Starting Game Backend Server...
cd backend
start cmd /k "npm start"
cd ..

echo [4/4] Starting React Frontend...
cd frontend
start cmd /k "npm run dev"
cd ..

echo All services started! Check the new command prompt windows for logs.
echo Open http://localhost:5173 in your browser to play!
