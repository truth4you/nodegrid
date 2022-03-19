const { ethers, upgrades} = require("hardhat")
const fs = require('fs')

const deploy = async (contractName,...args)=>{
  const factory = await ethers.getContractFactory(contractName)
  const contract = await factory.deploy(...args)
  await contract.deployed()
  console.log(contractName, contract.address)
  return contract
}

const deployProxy = async (contractName,args)=>{
  const factory = await ethers.getContractFactory(contractName)
  const contract = await upgrades.deployProxy(factory,args)
  await contract.deployed()
  console.log(contractName, contract.address)
  return contract
}

async function main() {
  const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

  let addrBUSD = "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7"

  console.log("Deploying PRESALE contract with %s on %s",owner.address,network.name)

  const NodePresale = await deploy("NodePresale")
  
  if (network.name === "localhost") {
    const BUSD = await deploy("BEP20Token")
    addrBUSD = BUSD.address
  }

  await (await NodePresale.updateTokenVest(addrBUSD)).wait()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
