const { ethers, waffle, upgrades} = require("hardhat");
const provider = waffle.provider;


async function main() {

    const [owner] = await ethers.getSigners();
    console.log(
        "Deploying the contracts with the account:",
        owner.address
    );

    console.log("Account balance:", (await owner.getBalance()).toString());
    
    const TokenFactory = await ethers.getContractFactory("TokenV4");
    Token =  await upgrades.upgradeProxy("0x41512d704bef37902e2af615e5a6ecb5b13d7686", TokenFactory)
    await Token.deployed();
    console.log("Token:", Token.address)

    // const NftFactory = await ethers.getContractFactory("BoostNFT")
    // NFT = await NftFactory.deploy()
    // await NFT.deployed()
    // console.log("NFT address", NFT.address)

    // const nodegirdFactory = await ethers.getContractFactory("NodeManager");
    // UpgradNodeGrid = await upgrades.upgradeProxy("0x163e36c40f2A15DE062253AcDde2c163C63727ED",nodegirdFactory)
    // await UpgradNodeGrid.deployed();
    // console.log("NodeGrid:", UpgradNodeGrid.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});
