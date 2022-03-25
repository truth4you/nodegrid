const { expect } = require("chai")
const { ethers, waffle, upgrades } = require("hardhat")
const fs = require('fs')

let owner, addr1, addr2, addrs;
let Token, Router, WETH, Pair;
    
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
const upgradeProxy = async (contractName, contractAddress)=>{
    const factory = await ethers.getContractFactory(contractName)
    const contract = await upgrades.upgradeProxy(contractAddress, factory)
    await contract.deployed()
    console.log(contractName, contract.address)
    return contract
}
const balance = async (state) => {
    // console.log(`Addr1 ETH (${state})`,ethers.utils.formatEther(await waffle.provider.getBalance(addr1.address)))
    // console.log(`Addr1 TTK (${state})`,ethers.utils.formatEther(await Token.balanceOf(addr1.address)))
    // console.log(`Addr4 TTK (${state})`,ethers.utils.formatEther(await Token.balanceOf(addrs[4].address)))
    // console.log(`Pair ETH (${state})`,ethers.utils.formatEther(await waffle.provider.getBalance(Pair)))
    // console.log(`Pair TTK (${state})`,ethers.utils.formatEther(await Token.balanceOf(Pair)))
}

describe("TokenTest", ()=>{
    describe("Deploy", () => {
        it("Deploy", async () => {
            [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

            WETH = await deploy("WETH")
            Token = await deployProxy("TokenV1")
            Token = await upgradeProxy("Token", Token.address)
            const Factory = await deploy("PancakeFactory",WETH.address)
            const path = './contracts/Uniswap/Router.sol'
            const content = fs.readFileSync(path)
            fs.writeFileSync(path,content.toString('utf8').replace(/[\da-f]{64}/mi,String(await Factory.INIT_CODE_PAIR_HASH()).slice(2)))
            Router = await deploy("PancakeRouter", Factory.address, WETH.address)
            addrRouter = Router.address
            addrTreasury = addrs[3].address
            addrOperator = addrs[4].address

            await(await Token.approve(Router.address, ethers.utils.parseEther("100000000"))).wait()
            await(await Router.addLiquidityETH(Token.address, ethers.utils.parseEther("1000000") ,"0","0", owner.address, parseInt(new Date().getTime()/1000)+100 ,{ value: ethers.utils.parseEther("1000") })).wait()
            await(await Token.updateuniswapV2Router(Router.address)).wait()
            Pair = await Token.uniswapV2Pair()
            await balance('init')
        })
    })

    describe("Transfer", () => {
        it("buy token from Route", async () => {
            await balance("state1")
            // await(await Token.setTransferTaxRate(0)).wait()
            await(await Router.connect(addr1).swapExactETHForTokensSupportingFeeOnTransferTokens(0,[await(Router.WETH()),Token.address],addr1.address,parseInt(new Date().getTime()/1000)+100,{value:ethers.utils.parseEther("10")} )).wait()
            await balance("state2")
        })
        // it("transfer other to other", async () => {
        //     await(await Token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("1500"))).wait()
        //     // await(await Token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("50000"))).wait()
        // })
        // it("transfer other to other", async () => {
        //     await(await Token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("50000"))).wait()
        // })
        // it("buy token from Router" ,async ()=>{
        //     await(await Router.connect(addr1).swapExactETHForTokens(0,[await(Router.WETH()),Token.address],addr1.address,parseInt(new Date().getTime()/1000)+100,{value:ethers.utils.parseEther("10")} )).wait()
        // })
        it("sell token from Router" ,async ()=>{
            await (await Token.setCheckNodeBeforeSell(true)).wait()
            const amount = await Token.balanceOf(addr1.address)
            await(await Token.connect(addr1).approve(Router.address,amount)).wait()
            await balance("before")
            console.log(addr1.address)
            await(await Router.connect(addr1).swapExactTokensForETHSupportingFeeOnTransferTokens(amount,0,[Token.address,await(Router.WETH())],addr1.address,parseInt(new Date().getTime()/1000+1000) )).wait()
            await balance("after")
        })
    })
})



  
