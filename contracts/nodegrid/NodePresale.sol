//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '../common/SafeMath.sol';
import '../common/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';

contract NodePresale is Ownable {
    using SafeMath for uint256;

    address[] private addresses;
    mapping (address => bool) public allowance;
    mapping (address => bool) public supplies;
    uint256 public totalSupply = 0;
    uint256 public maxSupply = 150;
    uint256 public totalPlan = 0;
    uint256 public maxPlan = 200;
    uint256 public endTime = 0;
    uint256 public duration = 1 days;
    bool public started = false;
    uint256 public minVest = 1000 ether;
    uint256 public maxVest = 1000 ether;
    address public tokenVest = address(0);
    string public tokenVestSymbol = 'ETH';
    uint8 public tokenVestDecimals = 18;

    function updateDuration(uint256 _duration) public onlyOwner {
        require(started==false, "Already started");
        duration = _duration;
        endTime = block.timestamp.add(_duration);
    }

    function updateEndTime(uint256 _endTime) public onlyOwner {
        require(started==false, "Already started");
        endTime = _endTime;
    }

    function updateMaxPlan(uint256 _maxPlan) public onlyOwner {
        maxPlan = _maxPlan;
    }

    function updateMaxSupply(uint256 _maxSupply) public onlyOwner {
        maxSupply = _maxSupply;
    }

    function updateMaxVest(uint256 _maxVest) public onlyOwner {
        maxVest = _maxVest;
    }

    function updateMinVest(uint256 _minVest) public onlyOwner {
        minVest = _minVest;
    }

    function updateTokenVest(address _tokenVest) public onlyOwner {
        tokenVest = _tokenVest;
        if(_tokenVest==address(0)) {
            tokenVestDecimals = 18;
            tokenVestSymbol = "ETH";
        } else {
            IERC20Metadata token = IERC20Metadata(_tokenVest);
            tokenVestSymbol = token.symbol();
            tokenVestDecimals = token.decimals();
        }
    }

    function start(uint256 _endTime) public onlyOwner {
        if(_endTime>block.timestamp)
            updateEndTime(_endTime);
        else
            updateDuration(duration);
        started = true;
    }

    function allow(address[] memory _accounts) public onlyOwner {
        for(uint256 i = 0;i<_accounts.length;i++) {
            address account = _accounts[i];
            if(!allowance[account]) {
                addresses.push(account);
                allowance[account] = true;
                totalPlan ++;
            }
        }
        require(totalPlan < maxPlan, "Cannot add more addresses because of overflow MAX_PLAN.");
    }

    function deny(address[] memory _accounts) public onlyOwner {
        for(uint256 i = 0;i<_accounts.length;i++) {
            address account = _accounts[i];
            if(allowance[account] && !supplies[account]) {
                allowance[account] = false;
                totalPlan --;
            }
        }
    }

    function whitelist(bool _supplied) public view returns (address[] memory) {
        uint256 len = _supplied ? totalSupply : totalPlan;
        address[] memory accounts = new address[](len);
        if(len==0) return accounts;
        uint256 j = 0;
        for(uint256 i = 0;i<addresses.length;i++) {
            address account = addresses[i];
            if(_supplied && !supplies[account])
                continue;
            if(allowance[account]) 
                accounts[j++] = account;
        }
        return accounts;
    }

    function vest() public payable {
        address recipient = owner();
        require(started==true, "Presale does not started.");
        require(block.timestamp<endTime, "Presale finished.");
        require(allowance[recipient]==true, "Not allowed vester.");
        require(supplies[recipient]==false, "Already vested.");
        require(totalSupply<maxSupply, "Max supply overflow.");
        if(tokenVest==address(0)) {
            require(msg.value>=minVest && msg.value<=maxVest, "Insufficient ETH value.");
            payable(owner()).transfer(msg.value);
        } else {
            uint256 amountSend = maxVest.mul(tokenVestDecimals).div(18);
            IERC20 token = IERC20(tokenVest);
            require(token.balanceOf(msg.sender)>=amountSend, "Insufficient Token balance");
            token.transferFrom(msg.sender, owner(), amountSend);
        }
        supplies[owner()] = true;
        totalSupply ++;
    }
}