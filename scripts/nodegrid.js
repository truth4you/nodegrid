const { expect } = require("chai")
const { ethers, upgrades } = require("hardhat")
const fs = require('fs')

const toTimestamp = (date) => parseInt(date==undefined?new Date():new Date(date)/1000)
const setBlockTime = async (date)=>{
  await network.provider.send("evm_setNextBlockTimestamp", [parseInt(date==undefined?new Date():new Date(date)/1000)] )
  await network.provider.send("evm_mine") 
}

describe("NodeGrid", ()=>{
  let owner, addr1, addr2, addrs;
  let Token, NodeGrid, NFT,RouterContract;

  describe("Deploy", () => {
    it("Deploy", async () => {
      [owner, addr1, addr2, ...addrs] = await ethers.getSigners();


      const WETHContract = await ethers.getContractFactory("WETH");
      WETH = await WETHContract.deploy();
      console.log("WETH",WETH.address)
      // factory deploy
      Factory = await ethers.getContractFactory("PancakeFactory");
      FactoryContract = await Factory.deploy(WETH.address);
      console.log("factory", FactoryContract.address)
      console.log(await(FactoryContract.INIT_CODE_PAIR_HASH()))
      // Router deploy
      Router = await ethers.getContractFactory("PancakeRouter");
      RouterContract = await Router.deploy(FactoryContract.address, WETH.address);
      console.log("Router", RouterContract.address)

      const tokenFactory = await ethers.getContractFactory("TokenV2");
      Token = await upgrades.deployProxy(tokenFactory)
      await Token.deployed();
      console.log("Token",Token.address)

      const nodegirdFactory = await ethers.getContractFactory("NodeManager");
      NodeGrid = await upgrades.deployProxy(nodegirdFactory,[Token.address]);
      await NodeGrid.deployed();
      console.log("NodeGrid",NodeGrid.address);

      await (await NodeGrid.setRouter(RouterContract.address)).wait()

      await (await NodeGrid.setTreasury(addrs[3].address)).wait();
      await (await NodeGrid.setOperator(addrs[4].address)).wait();
      // // expect(await NodeGrid.owner()).to.equal(owner.address)

    })

    it("Add Liquidity", async ()=>{
      
      await(await Token.approve(RouterContract.address, ethers.utils.parseEther("100000000"))).wait()
      await(await RouterContract.addLiquidityETH(Token.address, "1000000000000000000000" ,"0","0", owner.address, parseInt(new Date().getTime()/1000)+100 ,{ value: "1000000000000000000" })).wait()
    })

    
    let tiers
    // it("tiers.length==3", async ()=>{
    //   tiers = await NodeGrid.tiers()
    //   expect(tiers.length).to.equal(3)
    // })
    // it("tier[0].name==basic", async ()=>{
    //   expect(tiers[0].name).to.equal("basic")
    // })
    // it("tier[0].price==1.25 ether", async ()=>{
    //     expect(tiers[0].price).to.equal("10000000000000000000")
    // })
    // it("tier[1].name==light", async ()=>{
    //   expect(tiers[1].name).to.equal("light")
    // })
    // it("tier[2].name==pro", async ()=>{
    //   expect(tiers[2].name).to.equal("pro")
    // })
    
  })

  describe(" NFTDeploy", () => {
    it("Deploy", async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
            
        const BoostNFT = await ethers.getContractFactory("BoostNFT");
        NFT = await BoostNFT.deploy();
        await NFT.deployed();
        console.log("NFT", NFT.address)
    })
    it("set NFT address on nodeGrid contract", async () => {
      await(await NodeGrid.setNFTAddress(NFT.address)).wait()
    })
     
    it("send NFT1", async () => {
        setBlockTime("2022-03-05")
        await(await NFT.setApprovalForAll(addr1.address, true)).wait()
        await(await NFT.safeTransferFrom(owner.address, addr1.address, 0, 1,[])).wait()
    })
    it("send NFT2", async () => {
        setBlockTime("2022-03-08")
        // await(await NFT.connect(addr1).safeTransferFrom(addr1.address, addr2.address, 0, 1,[])).wait()
        await(await NFT.setApprovalForAll(addrs[3].address, true)).wait()
        // await(await NFT.safeTransferFrom(owner.address, addrs[3].address, 2, 1,[])).wait()
    })
    it("send NFT3", async () => {
        setBlockTime("2022-03-10")
        await(await NFT.setApprovalForAll(addrs[2].address, true)).wait()
        await(await NFT.safeTransferFrom(owner.address, addr2.address, 0, 1,[])).wait()
        await(await NFT.setApprovalForAll(addrs[3].address, true)).wait()
        await(await NFT.safeTransferFrom(owner.address, addrs[3].address, 1, 1,[])).wait()
    })
    it("send NFT4", async () => {
        setBlockTime("2022-03-12")
        await(await NFT.setApprovalForAll(addrs[2].address, true)).wait()
        await(await NFT.safeTransferFrom(owner.address, addr2.address, 0, 1,[])).wait()
        
        await(await NFT.connect(addrs[3]).safeTransferFrom(addrs[3].address, addrs[2].address, 1, 1,[])).wait()
    })
    it("get Multiplier", async () => {
        const multi1 = await NFT.getMultiplier(addr1.address, toTimestamp("2022-02-28"), toTimestamp("2022-03-20"))
        console.log("1.1",ethers.utils.formatEther(multi1))
        const multi11 = await NFT.getMultiplier(addr1.address, toTimestamp("2022-02-28"), toTimestamp("2022-03-13"))
        const multi12 = await NFT.getLastMultiplier(addr1.address, toTimestamp("2022-03-13"));
        console.log("1.2", multi11.toString(), multi12,(multi11*(toTimestamp("2022-03-13")-toTimestamp("2022-02-28"))+(toTimestamp("2022-03-20")-toTimestamp("2022-03-13"))*multi12)/(toTimestamp("2022-03-20")-toTimestamp("2022-02-28")))
        const multi2 = await NFT.getMultiplier(addr2.address, toTimestamp("2022-02-28"), toTimestamp("2022-03-13"))
        console.log("2",multi2/1000000000000000000)
        const multi3 = await NFT.getMultiplier(addrs[3].address, toTimestamp("2022-02-28"), toTimestamp("2022-03-13"))
        console.log("3", multi3/1000000000000000000)
    })
  })


  describe("Tier Action", () => {
    // it("add(new)", async ()=>{
    //   await (await NodeGrid.addTier("new","7250000000000000000","250000000000000000",86400)).wait()
    // })
    // let tiers
    // it("tiers.length==4", async ()=>{
    //   tiers = await NodeGrid.tiers()
    //   expect(tiers.length).to.equal(4)
    // })
    // it("tier[3].name==new", async ()=>{
    //   expect(tiers[3].name).to.equal("new")
    // })
    // it("update(new=>extra)", async ()=>{
    //   await (await NodeGrid.updateTier("new","extra","1350000000000000000","250000000000000000",86400)).wait()
    // })
    // it("tiers.length==4", async ()=>{
    //   tiers = await NodeGrid.tiers()
    //   expect(tiers.length).to.equal(4)
    // })
    // it("tier[3].name==extra", async ()=>{
    //   expect(tiers[3].name).to.equal("extra")
    // })
    // it("remove(basic)", async ()=>{
    //   await (await NodeGrid.removeTier("basic")).wait()
    //   expect(await NodeGrid.tierTotal()).to.equal(3)
    // })
    // it("tiers.length==3", async ()=>{
    //   tiers = await NodeGrid.tiers()
    //   expect(tiers.length).to.equal(3)
    // })
    // it("tier[0].name==light", async ()=>{
    //   expect(tiers[0].name).to.equal("light")
    // })
  })

  describe("Node Create", () => {
    it("send tokens", async()=>{
      await (await Token.transfer(addr1.address, "1000000000000000000000000")).wait()
      expect(await Token.balanceOf(addr1.address)).to.equal("1000000000000000000000000")
      await (await Token.transfer(addr2.address, "1000000000000000000000000")).wait()
      expect(await Token.balanceOf(addr2.address)).to.equal("1000000000000000000000000")
    })
    it("approve", async ()=>{
      await (await Token.connect(addr1).approve(NodeGrid.address,"1000000000000000000000000")).wait()
      expect(await Token.allowance(addr1.address,NodeGrid.address)).to.equal("1000000000000000000000000")
      await (await Token.connect(addr2).approve(NodeGrid.address,"1000000000000000000000000")).wait()
      expect(await Token.allowance(addr2.address,NodeGrid.address)).to.equal("1000000000000000000000000")
    })
    it("create basic 5 for addr1", async ()=>{
      await setBlockTime("2022-04-01")
      await (await NodeGrid.connect(addr1).create("basic","Node1 - BASIC",5)).wait()
      expect(await NodeGrid.countTotal()).to.equal(5)
    })
    it("create light 2 for addr1", async ()=>{
      await setBlockTime("2022-04-05")
      await (await NodeGrid.connect(addr1).create("light","Node1 - LIGHT",2)).wait()
      expect(await NodeGrid.countTotal()).to.equal(7)
      expect(await NodeGrid.countOfUser(addr1.address)).to.equal(7)
    })
    it("create basic 3 for addr2", async ()=>{
      await setBlockTime("2022-04-07")
      await (await NodeGrid.connect(addr2).create("basic","Node2 - BASIC",3)).wait()
      expect(await NodeGrid.countTotal()).to.equal(10)
    })
    it("count of nodes", async ()=>{
      expect(await NodeGrid.countOfUser(addr2.address)).to.equal(3)
      expect(await NodeGrid.countOfTier("basic")).to.equal(8)
      expect(await NodeGrid.countOfTier("light")).to.equal(2)
    })
    it("claimable tokens", async()=>{
      await setBlockTime("2022-04-25")
      console.log("claimable tokens",(await NodeGrid.connect(addr1).claimable()).toString())
    })
    it("get nodes of addr1", async()=>{
      const nodes = await NodeGrid.nodes(addr1.address)
      console.log(await NodeGrid.getBoostRate(addr1.address, toTimestamp("2022-02-28"), toTimestamp("2022-03-20")))
      const multi1 = await NFT.getMultiplier(addr1.address, toTimestamp("2022-02-28"), toTimestamp("2022-03-20"))
        console.log("1.1",ethers.utils.formatEther(multi1))
      console.log(nodes)
      expect(nodes.length).to.equal(7)
      expect(nodes[0].title).to.equal('Node1 - BASIC')
    })
    it("get nodes of addr2", async()=>{
      const nodes = await NodeGrid.nodes(addr2.address)
      expect(nodes.length).to.equal(3)
      expect(nodes[2].title).to.equal('Node2 - BASIC')
    })
  })

  describe("Node Compound", () => {
    it("compound with light 1 for addr1", async()=>{
      await setBlockTime("2022-05-20")
      await (await NodeGrid.connect(addr1).compound("light", "Node1 - Comp - LIGHT", 1)).wait()
      expect(await NodeGrid.countTotal()).to.equal(11)
    })
    it("get nodes of addr1", async()=>{
      const nodes = await NodeGrid.nodes(addr1.address)
      expect(nodes.length).to.equal(8)
      expect(nodes[7].title).to.equal('Node1 - Comp - LIGHT')
    })
    it("compound with basic 1 for addr2", async()=>{
      console.log("claimable",(await NodeGrid.connect(addr2).claimable()).toString())
      await (await NodeGrid.connect(addr2).compound("basic", "Node2 - Comp - BASIC", 1)).wait()
      expect(await NodeGrid.countTotal()).to.equal(12)
    })
    it("get nodes of addr2", async()=>{
      const nodes = await NodeGrid.nodes(addr2.address)
      expect(nodes.length).to.equal(4)
      expect(nodes[3].title).to.equal('Node2 - Comp - BASIC')
    })
    it("get rewards of addr1", async()=>{
      console.log((await NodeGrid.rewardsOfUser(addr1.address)).toString())
      console.log((await Token.balanceOf(addr1.address)).toString())
    })
    it("get rewards of addr2", async()=>{
      console.log((await NodeGrid.rewardsOfUser(addr2.address)).toString())
      console.log((await Token.balanceOf(addr2.address)).toString())
    })
    it("get rewards of total", async()=>{
      console.log((await NodeGrid.rewardsTotal()).toString())
      console.log((await Token.balanceOf(NodeGrid.address)).toString())
    })
  })
  describe("Claim", () => {
    it("claim for addr1", async()=>{
      await setBlockTime("2022-05-25")
      await (await NodeGrid.connect(addr1).claim()).wait()
    })
    it("get rewards of addr1", async()=>{
      console.log((await NodeGrid.rewardsOfUser(addr1.address)).toString())
      console.log((await Token.balanceOf(addr1.address)).toString())
    })
    it("get rewards of total", async()=>{
      console.log("rewardsTotal",(await NodeGrid.rewardsTotal()).toString())
      console.log((await Token.balanceOf(NodeGrid.address)).toString())
    })
  })
  describe("Node Upgrade", () => {
    it("upgrade 1 from basic to light for addr1", async()=>{
      console.log((await Token.balanceOf(addr1.address)).toString())
      await (await NodeGrid.connect(addr1).upgrade("basic", "light", 1)).wait()
      console.log((await Token.balanceOf(addr1.address)).toString())
      expect(await NodeGrid.countOfTier("basic")).to.equal(8)
    })
  })
  describe("Node Transfer", () => {
    it("transfer basic 1 from addr1 to addr2", async()=>{
      await (await NodeGrid.connect(addr1).transfer("basic", 1, addr2.address)).wait()
      expect(await NodeGrid.countOfUser(addr1.address)).to.equal(7)
      expect(await NodeGrid.countOfUser(addr2.address)).to.equal(5)
      expect(await NodeGrid.countTotal()).to.equal(12)
    })
  })
  describe("Node Burn", () => {
    it("burn for nodes", async()=>{
      await (await NodeGrid.burnNodes([1,2,7])).wait()
      expect(await NodeGrid.countOfUser(addr1.address)).to.equal(5)
      expect(await NodeGrid.countOfUser(addr2.address)).to.equal(4)
      expect(await NodeGrid.countOfTier("basic")).to.equal(7)
      expect(await NodeGrid.countTotal()).to.equal(9)
    })
    it("burn for addr2", async()=>{
      await (await NodeGrid.burnUser(addr2.address)).wait()
      expect(await NodeGrid.countOfUser(addr2.address)).to.equal(0)
      expect(await NodeGrid.countOfTier("basic")).to.equal(3)
      expect(await NodeGrid.countTotal()).to.equal(5)
    })
  })
  describe("Payment", () => {
    it("unpaid nodes", async()=>{
      console.log((await NodeGrid.unpaidNodes()).length)
      // await (await NodeGrid.connect(addr1).pay(2)).wait()
      console.log((await NodeGrid.unpaidNodes()).length)
    })
  })


})



  
