//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract TokenV1 is ERC20Upgradeable {
    function initialize() public initializer {
        __ERC20_init("TEST TOKEN", "TTK");
        _mint(msg.sender, 1000000000000000e18);
    }
    
}

