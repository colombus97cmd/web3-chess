import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("ChessWager", function () {
  let chessWager;
  let owner;
  let backendSigner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, backendSigner, player1, player2] = await ethers.getSigners();
    const ChessWager = await ethers.getContractFactory("ChessWager");
    chessWager = await ChessWager.deploy(backendSigner.address);
  });

  it("Should create a game and allow a player to join", async function () {
    const wagerAmount = ethers.parseEther("0.1");
    await chessWager.connect(player1).createGame("game1", { value: wagerAmount });
    
    let game = await chessWager.games("game1");
    expect(game.player1).to.equal(player1.address);
    expect(game.wagerAmount).to.equal(wagerAmount);

    await chessWager.connect(player2).joinGame("game1", { value: wagerAmount });
    
    game = await chessWager.games("game1");
    expect(game.player2).to.equal(player2.address);
  });
});
