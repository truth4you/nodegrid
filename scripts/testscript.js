// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");
const provider = waffle.provider;
// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
 
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
                    /************  Router deploy start  ***************/
      //WETH contract deploy
    const WETHContract = await ethers.getContractFactory("WETH");
    WETH = await WETHContract.deploy();
    console.log("WETH:",WETH.address)
    // factory deploy
    Factory = await ethers.getContractFactory("PancakeFactory");
    FactoryContract = await Factory.deploy("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
        //const FactoryContract = await ethers.getContractAt("PancakeFactory", "0xe8D2A1E88c91DCd5433208d4152Cc4F399a7e91d");
    console.log("Factory", FactoryContract.address)
    console.log("Factory.INIT_CODE_PAIR_HASH", await FactoryContract.INIT_CODE_PAIR_HASH())
    // Router deploy
    Router = await ethers.getContractFactory("PancakeRouter");
    RouterContract = await Router.deploy("0x6C2d83262fF84cBaDb3e416D527403135D757892", "0x638A246F0Ec8883eF68280293FFE8Cfbabe61B44");
    console.log("Router",RouterContract.address)

                        /************  Router deploy end  ***************/

                        /************  main contracts deploy start ***************/

    // token deploy
    const Token = await ethers.getContractFactory("NodeGrid");
    NodeGrid = await Token.deploy(["0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc","0x90f79bf6eb2c4f870365e785982e1f101e93b906","0x15d34aaf54267db7d7c367839aaf71a00a2c6a65","0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc"],["7","1","1","1"]);
    console.log("NodeGrid",await NodeGrid.address)

    // // // libarary deploy for noderewardmanagement contreact deploy
    library = await ethers.getContractFactory("IterableMapping");
    IterableMapping = await library.deploy();
    // // noderewordmanagement contract deploy
    const NodeCont = await ethers.getContractFactory("NODERewardManagement", {
    libraries: {
        IterableMapping: IterableMapping.address,
    },
    });
    NodeContract = await NodeCont.deploy();
    console.log("NODERewardManagement",await NodeContract.address)


        // // set nodeRewardManagement address to NodeGrid token contract
            const tx0 = await NodeGrid.setNodeManagement(await NodeContract.address)
            await tx0.wait();

        // set nodeTier to nodeRewardManagement contract
        const tx1 = await NodeContract.addTierInfo("light","1000000000000000000", "1000000000000000", "300") // price 1e18, rewardpertime 0.001e18
        await tx1.wait();
        await(await NodeContract.addTierInfo("basic","10000000000000000000", "10000000000000000", "300")).wait() // price 10e18, rewardpertime 0.01e18
        await(await NodeContract.addTierInfo("pro","100000000000000000000", "100000000000000000", "300")).wait() // price 100e18, rewardpertime 0.1e18
        // updateManagers with token contract
        const tx11 = await NodeContract.updateManagers(NodeGrid.address, true)
        await tx11.wait();

         // _changeCreateMultiNodeEnabled
        const tx12 = await NodeContract._changeCreateMultiNodeEnabled(true)
        await tx12.wait();

                            /************* main contracts deploy end ***********
    
                            /******** launch start **********
        // // Transfer 100,000 tokens from owner to token
          const tx2 = await NodeGrid.transfer( NodeGrid.address, "100000000000000000000000");
          await tx2.wait();
          console.log("NodeGridTokenBalance",await NodeGrid.balanceOf(NodeGrid.address))

            //   // Transfer 1 eth from owner to tokencontract
            const tx3 = await owner.sendTransaction({
                to: NodeGrid.address,
                value: ethers.constants.WeiPerEther,
            });
            await tx3.wait();
            console.log(`Transferred 1 ETH ${await provider.getBalance(NodeGrid.address)} ${ethers.constants.WeiPerEther}`);

            // // console.log(await Router.factory())
            // launch nodegrid contract with add liquidity
            const tx4 = await NodeGrid.launch("0xa6e99A4ED7498b3cdDCBB61a6A607a4925Faa1B7");  /// router address
            await tx4.wait();
                                /******** launch end **********
              
              // Transfer 100,000 tokens from owner to token
                const txsendtoken = await NodeGrid.transfer( NodeGrid.address, "100000000000000000000000");
                await txsendtoken.wait();

              // create nodes //
              await(await NodeGrid.createNodeWithTokens("0","10")).wait()   /// 10 light nodes create

              await(await NodeGrid.createNodeWithTokens("1","10")).wait()   /// 10 basic nodes create

              await(await NodeGrid.createNodeWithTokens("2","10")).wait()   /// 10 pro nodes create
              // create nodes //*/


        // // get deployed token contract
        // const NodeGrid = await ethers.getContractAt("NodeGrid", "0xd0EC100F1252a53322051a95CF05c32f0C174354");
       
        // // // // get deployed nodeRewardManagement contract
        // const NodeContract = await ethers.getContractAt("NODERewardManagement", "0xCa57C1d3c2c35E667745448Fef8407dd25487ff8");
        // await network.provider.send("evm_setNextBlockTimestamp", [parseInt(new Date().getTime()/1000)] )
        // await network.provider.send("evm_mine") 

        // console.log("_getRewardAmountOfTotal", await NodeContract._getRewardAmountOfTotal(owner.address))
        // console.log("_getNodesRewardAvailable",await NodeContract._getNodesRewardAvailable(owner.address))
        // console.log("before cashout", await NodeGrid.balanceOf(owner.address))
        // await (await NodeContract._changeCashoutEnabled(true)).wait()
        // await(await NodeGrid.cashoutAll()).wait()
        // console.log("after cashout", await NodeGrid.balanceOf(owner.address))
        // console.log("_getNodesLastClaimTime",await NodeContract._getNodesLastClaimTime(owner.address))
        // console.log("_getRewardAmountOfOne",await NodeContract._getRewardAmountOf(owner.address,"1645595853"))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
