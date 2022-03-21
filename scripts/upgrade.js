const { ethers, waffle, upgrades} = require("hardhat");
const provider = waffle.provider;


async function main() {

    const [owner] = await ethers.getSigners();
    console.log(
        "Deploying the contracts with the account:",
        owner.address
    );

    console.log("Account balance:", (await owner.getBalance()).toString());
    
    // const TokenFactory = await ethers.getContractFactory("Token");
    // Token =  await upgrades.upgradeProxy("0x229653dad9Eb152DFF3477a1130aB81a67FB1D7C",TokenFactory)
    // await Token.deployed();
    // console.log("Token:", Token.address)

    // const NftFactory = await ethers.getContractFactory("BoostNFT")
    // NFT = await NftFactory.deploy()
    // await NFT.deployed()
    // console.log("NFT address", NFT.address)

    const nodegirdFactory = await ethers.getContractFactory("NodeManager");
    UpgradNodeGrid = await upgrades.upgradeProxy("0x4Ba84de00a0E899B182B5d02257A6270113655D7",nodegirdFactory)
    await UpgradNodeGrid.deployed();
    console.log("NodeGrid:", UpgradNodeGrid.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
