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

  let addrTreasury = "0x388f90C29a5eb9214dBc58bbcF48cB83e45ef1eC"
  let addrOperator = "0x388f90C29a5eb9214dBc58bbcF48cB83e45ef1eC"
  let addrRouter = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"

  console.log("Deploying the contracts with %s on %s",owner.address,network.name)

  const Token = await deployProxy("TokenV4")
  const NFT = await deploy("BoostNFT")
  const NodeGrid = await deployProxy("NodeManager",[Token.address]);

  if (network.name === "localhost") {
    const WETH = await deploy("WETH")
    const Factory = await deploy("PancakeFactory",WETH.address)
    const path = './contracts/Uniswap/Router.sol'
    const content = fs.readFileSync(path)
    fs.writeFileSync(path,content.toString('utf8').replace(/[\da-f]{64}/mi,String(await Factory.INIT_CODE_PAIR_HASH()).slice(2)))
    const Router = await deploy("PancakeRouter", Factory.address, WETH.address)
    await deploy("Multicall")
    addrRouter = Router.address
    addrTreasury = addr3.address
    addrOperator = addr4.address
  }
  await(await Token.approve(Router.address, ethers.utils.parseEther("100000000"))).wait()
  await(await Router.addLiquidityETH(Token.address, "1000000000000000000000" ,"0","0", owner.address, parseInt(new Date().getTime()/1000)+100 ,{ value: "1000000000000000000" })).wait()

  await (await NodeGrid.setNFTAddress(NFT.address)).wait()
  await (await NodeGrid.setTreasury(addrTreasury)).wait()
  await (await NodeGrid.setOperator(addrOperator)).wait()
  await(await NodeGrid.setRouter(addrRouter)).wait()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
