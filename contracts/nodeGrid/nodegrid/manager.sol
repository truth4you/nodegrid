//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../Uniswap/IUniswapV2Factory.sol";
import "../Uniswap/IUniswapV2Pair.sol";
import "../Uniswap/IUniswapV2Router02.sol";
import '../common/Address.sol';
import '../common/SafeMath.sol';
import '../common/IERC20.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./IBoostNFT.sol";
import "hardhat/console.sol";

struct Tier {
  uint8 id;
  string name;
  uint256 price;
  uint256 rewardsPerTime;
  uint32 claimInterval;
  uint256 maintenanceFee;
}

struct Node {
  uint32 id;
  uint8 tierIndex;
  string title;
  address owner;
  uint32 createdTime;
  uint32 claimedTime;
  uint32 limitedTime;
  uint256 multiplier;
}

contract NodeManager is Initializable {
  using SafeMath for uint256;
  address public tokenAddress;
  address public nftAddress;
  address public treasury;
  address[] public operators;
  Tier[] private tierArr;
  mapping(string => uint8) public tierMap;
  uint8 public tierTotal;
  Node[] private nodesTotal;
  mapping(address => uint256[]) private nodesOfUser;
  uint32 public countTotal;
  mapping(address => uint32) public countOfUser;
  mapping(string => uint32) public countOfTier;
  uint256 public rewardsTotal;
  mapping(address => uint256) public rewardsOfUser;

  uint32 public discountPer10; // 0.1%
  uint32 public withdrawRate; // 0.00%
  uint32 public transferFee; // 0%
  uint32 public rewardsPoolFee; // 70%
  uint32 public treasuryFee; // 70%
  uint32 public operatorFee; // 70%
  uint32 public maxCountOfUser; // 0-Infinite

  IUniswapV2Router02 public uniswapV2Router;

  address public owner;
  
  modifier onlyOwner() {
    require(owner == msg.sender, "Ownable: caller is not the owner");
    _;
  }

  event NodeCreated(address, string, uint32, uint32, uint32, uint32);
  event NodeUpdated(address, string, string, uint32);
  event NodeTransfered(address, address, uint32);

  // constructor(address token) {
  //   setTokenAddress(token);

  //   addTier('basic', 10 ether, 0.13 ether, 1 days, 0.001 ether);
  //   addTier('light', 50 ether, 0.80 ether, 1 days, 0.0005 ether);
  //   addTier('pro', 100 ether, 2 ether, 1 days, 0.0001 ether);
  // }

  function initialize(address token) public initializer {
    tokenAddress = token;
    owner = msg.sender;

    addTier('basic', 10 ether, 0.13 ether, 1 days, 0.001 ether);
    addTier('light', 50 ether, 0.80 ether, 1 days, 0.0005 ether);
    addTier('pro', 100 ether, 2 ether, 1 days, 0.0001 ether);

    discountPer10 = 10; // 0.1%
    withdrawRate = 0; // 0.00%
    transferFee = 0; // 0%
    rewardsPoolFee = 7000; // 70%
    treasuryFee = 2000; // 70%
    operatorFee = 1000; // 70%
    maxCountOfUser = 100; // 0-Infinite
    
  }

  function setNFTAddress(address _nftAddress) public onlyOwner {
    nftAddress = _nftAddress;
  }

  function transferOwnership(address newOwner) public onlyOwner {
    require(
        newOwner != address(0),
        "Ownable: new owner is the zero address"
    );
    owner = newOwner;
  }

  function setRewardsPoolFee(uint32 value) public {
    require(operatorFee + treasuryFee + value == 10000, "Total fee must be 100%");
    rewardsPoolFee = value;
  }

  function setTreasury(address account) public {
    require(treasury != account, "The same account!");
    treasury = account;
  }

  function setTreasuryFee(uint32 value) public {
    require(treasuryFee != value,"The same value!");
    require(operatorFee + value + rewardsPoolFee == 10000, "Total fee must be 100%");
    treasuryFee = value;
  }

  function setOperator(address account) public {
    operators.push(account);
  }

  function setOperatorFee(uint32 value) public {
    require(operatorFee != value,"The same value!");
    require(value + treasuryFee + rewardsPoolFee == 10000, "Total fee must be 100%");
    operatorFee = value;
  }
  
  function setRouter(address router) public {
    require(address(uniswapV2Router) != router, "The same address!");
    uniswapV2Router = IUniswapV2Router02(router);
  }

  function setDiscountPer10(uint32 value) public {
    require(discountPer10 != value,"The same value!");
    discountPer10 = value;
  }
  
  function setTransferFee(uint32 value) public {
    require(transferFee != value,"The same value!");
    transferFee = value;
  }
  
  function tiers() public view returns (Tier[] memory) {
    Tier[] memory tiersActive = new Tier[](tierTotal);
    uint8 j = 0;
    for (uint8 i = 0; i < tierArr.length; i++) {
      Tier storage tier = tierArr[i];
      if (tierMap[tier.name] > 0) tiersActive[j++] = tier;
    }
    return tiersActive;
  }

  function addTier(
    string memory name,
    uint256 price,
    uint256 rewardsPerTime,
    uint32 claimInterval,
    uint256 maintenanceFee
  ) public onlyOwner {
    require(price > 0, "Tier's price has to be positive.");
    require(rewardsPerTime > 0, "Tier's rewards has to be positive.");
    require(claimInterval > 0, "Tier's claim interval has to be positive.");
    tierArr.push(
      Tier({
	      id: uint8(tierArr.length),
        name: name,
        price: price,
        rewardsPerTime: rewardsPerTime,
        claimInterval: claimInterval,
        maintenanceFee: maintenanceFee
      })
    );
    tierMap[name] = uint8(tierArr.length);
    tierTotal++;
  }

  function updateTier(
    string memory tierName,
    string memory name,
    uint256 price,
    uint256 rewardsPerTime,
    uint32 claimInterval,
    uint256 maintenanceFee
  ) public onlyOwner {
    uint8 tierId = tierMap[tierName];
    require(tierId > 0, "Tier's name is incorrect.");
    require(price > 0, "Tier's price has to be positive.");
    require(rewardsPerTime > 0, "Tier's rewards has to be positive.");
    Tier storage tier = tierArr[tierId - 1];
    tier.name = name;
    tier.price = price;
    tier.rewardsPerTime = rewardsPerTime;
    tier.claimInterval = claimInterval;
    tier.maintenanceFee = maintenanceFee;
    tierMap[name] = tierId;
    tierMap[tierName] = 0;
  }

  function removeTier(string memory tierName) public onlyOwner {
    require(tierMap[tierName] > 0, 'Tier was already removed.');
    tierMap[tierName] = 0;
    tierTotal--;
  }

  function setTokenAddress(address token) public onlyOwner {
    tokenAddress = token;
  }

  function nodes(address account) public view returns (Node[] memory) {
    Node[] memory nodesActive = new Node[](countOfUser[account]);
    uint256[] storage nodeIndice = nodesOfUser[account];
    uint32 j = 0;
    for (uint32 i = 0; i < nodeIndice.length; i++) {
      uint256 nodeIndex = nodeIndice[i];
      if (nodeIndex > 0) {
        Node storage node = nodesTotal[nodeIndex - 1];
        if (node.owner == account) {
          nodesActive[j] = node;
          nodesActive[j++].multiplier = getBoostRate(account, node.claimedTime, block.timestamp);
          
        }
      }
    }
    return nodesActive;
  }

  function _create(
    string memory tierName,
    string memory title,
    uint32 count
  ) private returns (uint256) {
    require(countOfUser[msg.sender] < maxCountOfUser, 'Cannot create node more than MAX.');
    uint8 tierId = tierMap[tierName];
    Tier storage tier = tierArr[tierId - 1];
    for (uint32 i = 0; i < count; i++) {
      nodesTotal.push(
        Node({
          id: uint32(nodesTotal.length),
          tierIndex: tierId - 1,
          title: title,
          owner: msg.sender,
          multiplier: 0,
          createdTime: uint32(block.timestamp),
          claimedTime: uint32(block.timestamp),
          limitedTime: uint32(block.timestamp)
        })
      );
      uint256[] storage nodeIndice = nodesOfUser[msg.sender];
      nodeIndice.push(nodesTotal.length);
    }
    countOfUser[msg.sender] += count;
    countOfTier[tierName] += count;
    countTotal += count;
    uint256 amount = tier.price.mul(count);
    if (count >= 10) amount = amount.mul(10000 - discountPer10).div(10000);
    return amount;
  }

  function _transferOperatorFee(uint256 feeOperator) public {
    uint256 feeEachOperator = feeOperator.div(operators.length);
    for (uint32 i = 0; i < operators.length; i++) {
      if (i == operators.length - 1) {
        _transferETH(operators[i], feeOperator);
      } else {
        _transferETH(operators[i], feeEachOperator);
        feeOperator = feeOperator.sub(feeEachOperator);
      }
    }
  }

  function _transferFee(uint256 amount) private {
    require(amount != 0,"Transfer token amount can't zero!");
    require(treasury!=address(0),"Treasury address can't Zero!");
    require(address(uniswapV2Router)!=address(0), "Router address must be set!");

    uint256 feeTreasury = amount.mul(treasuryFee).div(10000);
    IERC20Upgradeable(tokenAddress).transferFrom(address(msg.sender), address(this), amount);

    _transferETH(treasury, feeTreasury);
    if (operators.length > 0) {
      uint256 feeRewardPool = amount.mul(rewardsPoolFee).div(10000);
      uint256 feeOperator = amount.sub(feeTreasury).sub(feeRewardPool);
      _transferOperatorFee(feeOperator);
    }
  }

  function _transferETH(address recipient, uint256 amount) private {
      address[] memory path = new address[](2);
      path[0] = address(tokenAddress);
      path[1] = uniswapV2Router.WETH();

      IERC20Upgradeable(tokenAddress).approve(address(uniswapV2Router), amount);

      uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amount,
        0, // accept any amount of ETH
        path,
        address(recipient),
        block.timestamp
      );
  }

  function create(
    string memory tierName,
    string memory title,
    uint32 count
  ) public {
    uint256 amount = _create(tierName, title, count);
    _transferFee(amount);
    emit NodeCreated(
      msg.sender,
      tierName,
      count,
      countTotal,
      countOfUser[msg.sender],
      countOfTier[tierName]
    );
  }

  function getBoostRate(address account, uint256 timeFrom, uint256 timeTo) public view returns (uint256) {
    uint256 multiplier = 1 ether;
    if(nftAddress == address(0)){
      return multiplier;
    }
    IBoostNFT nft = IBoostNFT(nftAddress);
    multiplier = nft.getMultiplier(account, timeFrom, timeTo);
    
    return multiplier;
  }

  function claimable() public view returns (uint256) {
    uint256 amount = 0;
    uint256[] storage nodeIndice = nodesOfUser[msg.sender];
    
    for (uint32 i = 0; i < nodeIndice.length; i++) {
      uint256 nodeIndex = nodeIndice[i];
      if (nodeIndex > 0) {
        Node storage node = nodesTotal[nodeIndex - 1];
        if (node.owner == msg.sender) {
          uint256 multiplier = getBoostRate(msg.sender, node.claimedTime, block.timestamp);
          Tier storage tier = tierArr[node.tierIndex];
          amount = uint256(block.timestamp - node.claimedTime)
            .mul(tier.rewardsPerTime)
            .mul(multiplier)
            .div(1 ether)
            .div(tier.claimInterval)
            .add(amount);
        }
      }
    }
    return amount;
  }

  function _claim(uint256 exceptAmount) private {
    uint256 claimableAmount = 0;
    uint256[] storage nodeIndice = nodesOfUser[msg.sender];
    for (uint32 i = 0; i < nodeIndice.length; i++) {
      uint256 nodeIndex = nodeIndice[i];
      if (nodeIndex > 0) {
        Node storage node = nodesTotal[nodeIndex - 1];
        if (node.owner == msg.sender) {
          uint256 multiplier = getBoostRate(msg.sender, node.claimedTime, block.timestamp);
          
          Tier storage tier = tierArr[node.tierIndex];
          claimableAmount = uint256(block.timestamp - node.claimedTime)
            .mul(tier.rewardsPerTime)
            .mul(multiplier)
            .div(1 ether)
            .div(tier.claimInterval)
            .add(claimableAmount);
          node.claimedTime = uint32(block.timestamp);
        }
      }
    }
    require(claimableAmount > 0, 'No claimable tokens.');
    if (exceptAmount > 0)
      require(claimableAmount >= exceptAmount, 'Insufficient claimable tokens to compound.');
    rewardsOfUser[msg.sender] = rewardsOfUser[msg.sender].add(claimableAmount);
    rewardsTotal = rewardsTotal.add(claimableAmount);
    IERC20Upgradeable(tokenAddress).transfer(address(msg.sender), claimableAmount.sub(exceptAmount));
  }

  function compound(
    string memory tierName,
    string memory title,
    uint32 count
  ) public {
    uint256 amount = _create(tierName, title, count);
    _claim(amount);
    emit NodeCreated(
      msg.sender,
      tierName,
      count,
      countTotal,
      countOfUser[msg.sender],
      countOfTier[tierName]
    );
  }

  function claim() public {
    _claim(0);
  }

  function upgrade(
    string memory tierNameFrom,
    string memory tierNameTo,
    uint32 count
  ) public {
    uint8 tierIndexFrom = tierMap[tierNameFrom];
    uint8 tierIndexTo = tierMap[tierNameTo];
    require(tierIndexFrom > 0, 'Invalid tier to upgrade from.');
    require(tierIndexTo > 0, 'Invalid tier to upgrade to.');
    Tier storage tierFrom = tierArr[tierIndexFrom - 1];
    Tier storage tierTo = tierArr[tierIndexTo - 1];
    require(tierTo.price > tierFrom.price, 'Unable to downgrade.');
    uint256[] storage nodeIndice = nodesOfUser[msg.sender];
    uint32 countUpgrade = 0;
    uint256 claimableAmount = 0;
    for (uint32 i = 0; i < nodeIndice.length; i++) {
      uint256 nodeIndex = nodeIndice[i];
      if (nodeIndex > 0) {
        Node storage node = nodesTotal[nodeIndex - 1];
        if (node.owner == msg.sender && tierIndexFrom - 1 == node.tierIndex) {
          node.tierIndex = tierIndexTo - 1;
          uint256 multiplier = getBoostRate(msg.sender, node.claimedTime, block.timestamp);
          uint256 claimed = uint256(block.timestamp - node.claimedTime)
            .mul(tierFrom.rewardsPerTime)
            .div(tierFrom.claimInterval);
          claimableAmount = claimed.mul(multiplier).div(10**18).add(claimableAmount);
          node.claimedTime = uint32(block.timestamp);
          countUpgrade++;
          if (countUpgrade == count) break;
        }
      }
    }
    require(countUpgrade == count, 'Not enough nodes to upgrade.');
    countOfTier[tierNameFrom] -= count;
    countOfTier[tierNameTo] += count;
    if (claimableAmount > 0) {
      rewardsOfUser[msg.sender] = rewardsOfUser[msg.sender].add(claimableAmount);
      rewardsTotal = rewardsTotal.add(claimableAmount);
      IERC20Upgradeable(tokenAddress).transfer(address(msg.sender), claimableAmount);
    }
    uint256 price = tierTo.price.sub(tierFrom.price).mul(count);
    if (count >= 10) price = price.mul(10000 - discountPer10).div(10000);
    _transferFee(price);
    emit NodeUpdated(msg.sender, tierNameFrom, tierNameTo, count);
  }

  function transfer(
    string memory tierName,
    uint32 count,
    address recipient
  ) public {
    uint8 tierIndex = tierMap[tierName];
    require(tierIndex > 0, 'Invalid tier to transfer.');
    Tier storage tier = tierArr[tierIndex - 1];
    uint256[] storage nodeIndiceFrom = nodesOfUser[msg.sender];
    uint256[] storage nodeIndiceTo = nodesOfUser[recipient];
    uint32 countTransfer = 0;
    uint256 claimableAmount = 0;
    for (uint32 i = 0; i < nodeIndiceFrom.length; i++) {
      uint256 nodeIndex = nodeIndiceFrom[i];
      if (nodeIndex > 0) {
        Node storage node = nodesTotal[nodeIndex - 1];
        if (node.owner == msg.sender && tierIndex - 1 == node.tierIndex) {
          node.owner = recipient;
          uint256 multiplier = getBoostRate(msg.sender, node.claimedTime, block.timestamp);
          uint256 claimed = uint256(block.timestamp - node.claimedTime)
            .mul(tier.rewardsPerTime)
            .div(tier.claimInterval);
          claimableAmount = claimed.mul(multiplier).div(10**18).add(claimableAmount);
          node.claimedTime = uint32(block.timestamp);
          countTransfer++;
          nodeIndiceTo.push(nodeIndex);
          nodeIndiceFrom[i] = 0;
          if (countTransfer == count) break;
        }
      }
    }
    require(countTransfer == count, 'Not enough nodes to transfer.');
    countOfUser[msg.sender] -= count;
    countOfUser[recipient] += count;
    if (claimableAmount > 0) {
      rewardsOfUser[msg.sender] = rewardsOfUser[msg.sender].add(claimableAmount);
      rewardsTotal = rewardsTotal.add(claimableAmount);
    }
    uint256 fee = tier.price.mul(count).mul(transferFee).div(10000);
    if (count >= 10) fee = fee.mul(10000 - discountPer10).div(10000);
    if (fee > claimableAmount)
      IERC20Upgradeable(tokenAddress).transferFrom(
        address(msg.sender),
        address(this),
        fee.sub(claimableAmount)
      );
    else if (fee < claimableAmount)
      IERC20Upgradeable(tokenAddress).transfer(address(msg.sender), claimableAmount.sub(fee));
    emit NodeTransfered(msg.sender, recipient, count);
  }

  function burnUser(address account) public onlyOwner {
    uint256[] storage nodeIndice = nodesOfUser[account];
    for (uint32 i = 0; i < nodeIndice.length; i++) {
      uint256 nodeIndex = nodeIndice[i];
      if (nodeIndex > 0) {
        Node storage node = nodesTotal[nodeIndex - 1];
        if (node.owner == account) {
          node.owner = address(0);
          node.claimedTime = uint32(block.timestamp);
          Tier storage tier = tierArr[node.tierIndex];
          countOfTier[tier.name]--;
        }
      }
    }
    nodesOfUser[account] = new uint256[](0);
    countTotal -= countOfUser[account];
    countOfUser[account] = 0;
  }

  function burnNodes(uint32[] memory indice) public onlyOwner {
    uint32 count = 0;
    for (uint32 i = 0; i < indice.length; i++) {
      uint256 nodeIndex = indice[i];
      if (nodeIndex > 0) {
        Node storage node = nodesTotal[nodeIndex - 1];
        if (node.owner != address(0)) {
          uint256[] storage nodeIndice = nodesOfUser[node.owner];
          for (uint32 j = 0; j < nodeIndice.length; j++) {
            if (nodeIndex == nodeIndice[j]) {
              nodeIndice[j] = 0;
              break;
            }
          }
          countOfUser[node.owner]--;
          node.owner = address(0);
          node.claimedTime = uint32(block.timestamp);
          Tier storage tier = tierArr[node.tierIndex];
          countOfTier[tier.name]--;
          count++;
        }
      }
    }
    countTotal -= count;
  }

  function withdraw(uint256 amount) public onlyOwner {
    require(
      IERC20Upgradeable(tokenAddress).balanceOf(address(this)) >= amount,
      'Withdraw: Insufficent balance.'
    );
    IERC20Upgradeable(tokenAddress).transfer(address(msg.sender), amount);
  }

  function withdrawAllETH() public onlyOwner {
    // get the amount of Ether stored in this contract
    uint256 amount = address(this).balance;

    // send all Ether to owner
    // Owner can receive Ether since the address of owner is payable
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Failed to send Ether");
  }

  function pay(uint8 count) public payable {
    require(count > 0 && count <= 2, 'Invalid number of months.');
    uint256 fee = 0;
    uint256[] storage nodeIndice = nodesOfUser[msg.sender];
    for (uint32 i = 0; i < nodeIndice.length; i++) {
      uint256 nodeIndex = nodeIndice[i];
      if (nodeIndex > 0) {
        Node storage node = nodesTotal[nodeIndex - 1];
        if (node.owner == msg.sender) {
          Tier storage tier = tierArr[node.tierIndex];
          node.limitedTime += count * uint32(30 days);
          fee = tier.maintenanceFee.mul(count).add(fee);
        }
      }
    }
    require(fee == msg.value,"Invalid Fee amount");

    for (uint32 j = 0; j < operators.length; j++){
      if(j < operators.length-1){
        require(payable(operators[j]).send(fee.div(operators.length)), "Failed to send Ether");
      }else{
        require(payable(operators[j]).send(fee.sub(fee.mul(operators.length-1).div(operators.length))), "Failed to send Ether");
      }
    }
  }

 

  function unpaidNodes() public view returns (Node[] memory) {
    uint32 count = 0;
    for (uint32 i = 0; i < nodesTotal.length; i++) {
      Node storage node = nodesTotal[i];
      if (node.owner != address(0) && node.limitedTime < uint32(block.timestamp)) {
        count++;
      }
    }
    Node[] memory nodesInactive = new Node[](count);
    uint32 j = 0;
    for (uint32 i = 0; i < nodesTotal.length; i++) {
      Node storage node = nodesTotal[i];
      if (node.owner != address(0) && node.limitedTime < uint32(block.timestamp)) {
        nodesInactive[j++] = node;
      }
    }
    return nodesInactive;
  }

  // function unpaidUsers() public view returns (address[] memory) {
  //   uint32 count = 0;
  //   mapping(address => bool) memory users;
  //   for (uint32 i = 0; i < nodesTotal.length; i++) {
  //     Node storage node = nodesTotal[i];
  //     if (
  //       node.owner != address(0) &&
  //       users[node.owner] == false &&
  //       node.limitedTime < uint32(block.timestamp)
  //     ) {
  //       count++;
  //       users[node.owner] = true;
  //     }
  //   }
  //   address[] memory usersInactive = new address[](count);
  //   uint32 j = 0;
  //   for (uint32 i = 0; i < nodesTotal.length; i++) {
  //     Node storage node = nodesTotal[i];
  //     if (
  //       node.owner != address(0) &&
  //       users[node.owner] == false &&
  //       node.limitedTime < uint32(block.timestamp)
  //     ) {
  //       usersInactive[j++] = node.owner;
  //     }
  //   }
  //   return usersInactive;
  // }
}
