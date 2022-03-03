const { ethers, waffle, upgrades} = require("hardhat");
const provider = waffle.provider;
// const hre = require("@nomiclabs/buidler");
// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
  // This is just a convenience check
  // if (network.name === "hardhat") {
  //   console.warn(
  //     "You are trying to deploy a contract to the Hardhat Network, which" +
  //       "gets automatically created and destroyed every time. Use the Hardhat" +
  //       " option '--network localhost'"
  //   );
  // }
  // ethers is available in the global scope
  const [owner] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    owner.address
  );

  console.log("Account balance:", (await owner.getBalance()).toString());
  
  const TokenFactory = await ethers.getContractFactory("TokenV2");
  const Token = await upgrades.deployProxy(TokenFactory)
  await Token.deployed();
    console.log("Token:", Token.address)

  const NftFactory = await ethers.getContractFactory("BoostNFT")
  NFT = await NftFactory.deploy()
  await NFT.deployed()
    console.log("NFT address", NFT.address)

  const nodegirdFactory = await ethers.getContractFactory("NodeManager");
  NodeGrid = await upgrades.deployProxy(nodegirdFactory,[Token.address]);
  await NodeGrid.deployed();
    console.log("NodeGrid:", NodeGrid.address)

  await (await NodeGrid.setNFTAddress(NFT.address)).wait()
  
  // transfer NFT
  // await(await NFT.setApprovalForAll("0x37112CB8E83B30B24bB39f453dcEE69f8cA61058", true)).wait()
  // await(await NFT.safeTransferFrom(owner.address, "0x37112CB8E83B30B24bB39f453dcEE69f8cA61058", 0, 100,[])).wait()
  

  await (await NodeGrid.setTreasury("0x388f90C29a5eb9214dBc58bbcF48cB83e45ef1eC")).wait()
  await (await NodeGrid.setOperator("0x388f90C29a5eb9214dBc58bbcF48cB83e45ef1eC")).wait()
  await(await NodeGrid.setRouter("0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3")).wait()
  

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
