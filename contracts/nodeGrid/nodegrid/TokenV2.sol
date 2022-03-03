//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract TokenV2 is ERC20Upgradeable {
    uint256 public txFee;
    // event Transfer(address, address, uint256);
    function initialize() public initializer {
        __ERC20_init("TEST TOKEN", "TTK");
        _mint(msg.sender, 100000000e18);
    }

    function setTaxFee(uint32 _txFee) public {
        txFee = _txFee;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
    
}