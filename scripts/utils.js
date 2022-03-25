const { ethers, waffle, upgrades } = require("hardhat")
const fs = require('fs')

const deploy = async (contractName,...args)=>{
    if(contractName==="PancakeRouter") {
        const Factory = await ethers.getContractAt("PancakeFactory", args[0])
        const path = './contracts/Uniswap/Router.sol'
        const content = fs.readFileSync(path)
        fs.writeFileSync(path,content.toString('utf8').replace(/[\da-f]{64}/mi,String(await Factory.INIT_CODE_PAIR_HASH()).slice(2)))
    }
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
const upgradeProxy = async (contractName, contractAddress)=>{
    const factory = await ethers.getContractFactory(contractName)
    const contract = await upgrades.upgradeProxy(contractAddress, factory)
    await contract.deployed()
    console.log(contractName, contract.address)
    return contract
}