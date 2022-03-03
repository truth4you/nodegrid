// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import '../common/SafeMath.sol';
import 'hardhat/console.sol';

struct UserLog {
    uint256 timestamp;
    uint256 multiplier;
}

struct TokenLog {
    uint256 timestamp;
    mapping(uint8 => uint256) multipliers;
}

contract BoostNFT is ERC1155 {
    using SafeMath for uint256;
    mapping(uint8 => string) private categoryNames;
    mapping(string => uint8) private categoryIndex;
    mapping(address => UserLog[]) private userLogs;
    mapping(uint8 => TokenLog[]) private tokenLogs;
    mapping(uint8 => uint256) public multipliers;
    uint8[] private tokens;

    uint8 public constant GOLD = 0;
    uint8 public constant SILVER = 1;
    uint8 public constant TITANIUM = 2;
    uint8 public constant COPPER = 3;
    uint8 public constant WOODEN = 4;

    constructor()
        ERC1155(
            "https://ipfs.io/ipfs/QmNqL26bqoEkvyEpwrqSsP5KGbFEsSNFKrRMwvLQ74jR59/"
        )
    {
        _mint(msg.sender, uint256(GOLD), 10**10, "gold");
        _mint(msg.sender, uint256(SILVER), 10**10, "silver");
        _mint(msg.sender, uint256(TITANIUM), 10**10, "titanium");
        _mint(msg.sender, uint256(COPPER), 10**10, "copper");
        _mint(msg.sender, uint256(WOODEN), 10**10, "wooden");

        setMultiplier(GOLD, 2000);
        setMultiplier(SILVER, 1500);
        setMultiplier(TITANIUM, 1300);
        setMultiplier(COPPER, 1200);
        setMultiplier(WOODEN, 1100);
    }

    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        super._mint(to, id, amount, data);
        tokens.push(uint8(id));
        categoryNames[uint8(id)] = string(data);
        categoryIndex[string(data)] = uint8(id);
    }

    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        
        super._safeTransferFrom(from, to, id, amount, data);
        // from
        UserLog[] storage logs1 = userLogs[from];
        uint256 multiplier = 1000;
        for(uint8 i = 0;i<tokens.length;i++) {
            if(balanceOf(from, tokens[i])>0 && multiplier < multipliers[tokens[i]]) {
                multiplier =  multipliers[tokens[i]];
            }
        }
        if(logs1.length > 0 && logs1[logs1.length-1].multiplier != multiplier)
            logs1.push(UserLog({
                timestamp: block.timestamp,
                multiplier: multiplier
            }));
        // to
        UserLog[] storage logs2 = userLogs[to];
        multiplier = multipliers[uint8(id)];
        for(uint8 i = 0;i<tokens.length;i++) {
            if(balanceOf(to, tokens[i])>0 && multiplier < multipliers[tokens[i]]) {
                multiplier =  multipliers[tokens[i]];
            }
        }
        
        if(logs2.length == 0 || (logs2.length > 0 && logs2[logs2.length-1].multiplier != multiplier) )   
            logs2.push(UserLog({
                timestamp: block.timestamp,
                multiplier: multiplier
            }));
    }

    function getLastMultiplier (address account, uint256 timeTo) public view returns(uint256){
        UserLog[] storage logs = userLogs[account];
        uint256 one = 1 ether;
        for(uint256 i = logs.length-1;i>=0;i--) {
            if(logs[i].timestamp <= timeTo)
                return one.mul(logs[i].multiplier).div(1000);
        }
        return one;
    }

    function getMultiplier(address account, uint256 timeFrom, uint256 timeTo) public view returns(uint256) {
        uint256 multiplier = 0;
        uint256 time = timeTo;
        uint256 one = 1 ether;
        UserLog[] storage logs = userLogs[account];
        for(uint256 i = logs.length; i > 0; i--) {
            uint256 timeBlock = logs[i-1].timestamp > timeFrom? logs[i-1].timestamp : timeFrom;
            if(timeTo < timeBlock)
                continue;
            uint256 duration = time - timeBlock;
            multiplier = one.mul(logs[i-1].multiplier).mul(duration).div(1000).add(multiplier);            
            time = timeBlock;
            if(timeFrom >= time)
                break;
        }
        if(timeFrom < time){
            multiplier = multiplier.add(one.mul(time.sub(timeFrom)));
        }            
        return multiplier.div(timeTo.sub(timeFrom));
    } 

    function setMultiplier(uint8 id, uint256 multiplier) public {
        multipliers[id] = multiplier;
        // TokenLog[] storage logs = tokenLogs[id];
        // logs.push(TokenLog());
        // TokenLog storage log = logs[logs.length];
        // log.timestamp = block.timestamp;
        // for(uint256 i = 0;i<tokens.length;i++) {
        //     log.multipliers[tokens[i]] = multipliers[tokens[i]];
        // }
    }

    function uri(uint256 id) public view override returns (string memory) {
        bytes memory name = bytes(categoryNames[uint8(id)]);
        require(name.length > 0, "Invalid token id.");
        string memory _uri = super.uri(id);
        return string(bytes.concat(bytes(_uri),name,bytes(".json")));
    }

    function hasBalance(address account, string memory name)
        public
        view
        returns (bool)
    {
        require(categoryIndex[name] >= 0, "Invalid token name.");
        return balanceOf(account, uint256(categoryIndex[name])) > 0;
    }
}
