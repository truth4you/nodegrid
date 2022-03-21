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
  let addrBUSD = "0x0"

  console.log("Deploying the contracts with %s on %s",owner.address,network.name)

  const Token = await deployProxy("Token")
  const NFT = await deploy("BoostNFT")
  const NodeGrid = await deployProxy("NodeManager",[Token.address])
  const NodePresale = await deploy("NodePresale")
  
  if (network.name === "localhost") {
    const WETH = await deploy("WETH")
    const BUSD = await deploy("BEP20Token")
    const Factory = await deploy("PancakeFactory",WETH.address)
    const path = './contracts/Uniswap/Router.sol'
    const content = fs.readFileSync(path)
    fs.writeFileSync(path,content.toString('utf8').replace(/[\da-f]{64}/mi,String(await Factory.INIT_CODE_PAIR_HASH()).slice(2)))
    const Router = await deploy("PancakeRouter", Factory.address, WETH.address)
    await deploy("Multicall")
    addrRouter = Router.address
    addrTreasury = addr3.address
    addrOperator = addr4.address
    addrBUSD = BUSD.address
    await(await Token.approve(Router.address, ethers.utils.parseEther("100000000"))).wait()
    await(await Router.addLiquidityETH(Token.address, ethers.utils.parseEther("1000") ,"0","0", owner.address, parseInt(new Date().getTime()/1000)+100 ,{ value: ethers.utils.parseEther("1000") })).wait()
    await(await BUSD.approve(NodeGrid.address, ethers.utils.parseEther("100000000"))).wait()
    // await(await NodeGrid.addWhitelist([addr1.address,addr2.address,addr3.address])).wait()   
    await(await NodeGrid.setPayTokenAddress(addrBUSD)).wait()
    await(await Token.setNodeManagerAddress(NodeGrid.address)).wait()
  }

  await (await NodeGrid.addTier('basic', ethers.utils.parseEther("10"), ethers.utils.parseEther("0.13"), 86400, ethers.utils.parseEther("0.001"))).wait()
  await (await NodeGrid.addTier('light', ethers.utils.parseEther("50"), ethers.utils.parseEther("0.8"), 86400, ethers.utils.parseEther("0.005"))).wait()
  await (await NodeGrid.addTier('pro', ethers.utils.parseEther("100"), ethers.utils.parseEther("2"), 86400, ethers.utils.parseEther("0.0001"))).wait()

  await (await NodePresale.updateTokenVest(addrBUSD)).wait()
  await (await NodePresale.allow([owner.address,addr1.address,addr2.address,addr3.address])).wait()
  await (await NodeGrid.setNFTAddress(NFT.address)).wait()
  await (await NodeGrid.setTreasury(addrTreasury)).wait()
  await (await NodeGrid.setOperator(addrOperator)).wait()
  await (await NodeGrid.setRouter(addrRouter)).wait()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
