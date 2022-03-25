//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../Uniswap/IUniswapV2Factory.sol";
import "../Uniswap/IUniswapV2Pair.sol";
import "../Uniswap/IUniswapV2Router02.sol";
import '../common/Address.sol';
import '../common/SafeMath.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "hardhat/console.sol";

interface INodeManager {
    function countOfUser(address account) external view returns(uint32);
}

contract Token is ERC20Upgradeable {
    using SafeMath for uint256;
    function initialize() public initializer {
        __ERC20_init("TEST TOKEN", "TTK");
        _mint(msg.sender, 1000000e18);
        owner = msg.sender;
        operator = msg.sender;
        transferTaxRate = 1000;
        buyBackFee = 3000;
        sellBackFee = 3000;
        operatorFee = 60;
        liquidityFee = 40;
        minAmountToLiquify = 10 * 1e18;
        maxTransferAmount = 1000 * 1e18;
        checkNodeBeforeSell = true;
        setExcludedFromFee(msg.sender);
    }
    // To receive BNB from uniswapV2Router when swapping
    receive() external payable {}

    bool private _inSwapAndLiquify;
    uint32 public transferTaxRate;  // 1000 => 10%
    uint32 private buyBackFee;      // 3000 => 30%
    uint32 public operatorFee;      // 60 => 6% (60*0.1)
    uint32 public liquidityFee;     // 40 => 4% (40*0.1)
    
    uint256 private minAmountToLiquify;
    
    address public owner;
    address public operator;
    mapping(address => bool) public isExcludedFromFee;
    
    IUniswapV2Router02 public uniswapV2Router;
    address public uniswapV2Pair;
    uint256 public maxTransferAmount; // 1000
    uint256 private accumulatedOperatorTokensAmount;
    address public nodeManagerAddress;
    bool public checkNodeBeforeSell;
    uint32 private sellBackFee;      // 3000 => 30%
    
    event SwapAndLiquify(uint256, uint256, uint256);
    event uniswapV2RouterUpdated(address, address, address);
    event LiquidityAdded(uint256, uint256);

    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }
    

    modifier lockTheSwap {
        _inSwapAndLiquify = true;
        _;
        _inSwapAndLiquify = false;
    }

    modifier transferTaxFree {
        uint32 _transferTaxRate = transferTaxRate;
        transferTaxRate = 0;
        _;
        transferTaxRate = _transferTaxRate;
    }

    function transferOwnerShip(address account) public onlyOwner {
        owner = account;
    }

    function setTransferTaxRate(uint32 _transferTaxRate) public onlyOwner{
        transferTaxRate = _transferTaxRate;
    }

    function setBuyFee(uint32 value) public onlyOwner{
        buyBackFee = value;
    }

    function setSellFee(uint32 value) public onlyOwner{
        sellBackFee = value;
    }

    function setOperator(address account) public onlyOwner {
        operator = account;
    }

    function setOperatorFee(uint32 value) public onlyOwner{
        operatorFee = value;
    }

    function setLiquidityFee(uint32 value) public onlyOwner {
        liquidityFee = value;
    }

    function setExcludedFromFee(address account) public onlyOwner{
        isExcludedFromFee[account] = true;
    }

    function removeExcludedFromFee(address account) public onlyOwner{
        isExcludedFromFee[account] = false;
    }

    function setMinAmountToLiquify(uint256 value) public onlyOwner{
        minAmountToLiquify = value;
    }

    function setMaxTransferAmount(uint256 value) public onlyOwner{
        maxTransferAmount = value;
    }

    function setNodeManagerAddress(address _nodeManagerAddress) public onlyOwner {
        nodeManagerAddress = _nodeManagerAddress;
    }

    function setCheckNodeBeforeSell(bool check) public onlyOwner {
        checkNodeBeforeSell = check;
    }

    /// @dev overrides transfer function to meet tokenomics
    function _transfer(address from, address to, uint256 amount) internal virtual override {
        bool _isSwappable = address(uniswapV2Router)!=address(0) && uniswapV2Pair!=address(0) && !_inSwapAndLiquify;
        bool _isBuying = _isSwappable && msg.sender==address(uniswapV2Pair) && from==address(uniswapV2Pair);
        bool _isSelling = _isSwappable && msg.sender==address(uniswapV2Router) && to==address(uniswapV2Pair);  

        uint256 _amount = amount;
                
        if (transferTaxRate != 0 && !isExcludedFromFee[from] && !isExcludedFromFee[to]) {
            uint256 taxAmount = 0;
            if(_isSelling && checkNodeBeforeSell && nodeManagerAddress!=from && nodeManagerAddress != address(0)) {
                require(INodeManager(nodeManagerAddress).countOfUser(from) > 0, "Insufficient Node count!");
            }                    
            if(_isSelling && sellBackFee>0) {
                taxAmount = amount.mul(sellBackFee).div(10000);
            } else if(_isBuying && buyBackFee>0) {
                taxAmount = amount.mul(buyBackFee).div(10000);
            } else {
                // default tax is 10% of every transfer
                taxAmount = amount.mul(transferTaxRate).div(10000);
            }
            if(taxAmount>0) {
                uint256 operatorFeeAmount = taxAmount.mul(operatorFee).div(100);
                super._transfer(from, address(this), operatorFeeAmount);
                accumulatedOperatorTokensAmount += operatorFeeAmount;
                if(_isSelling) {
                    swapAndSendToAddress(operator,accumulatedOperatorTokensAmount);
                    accumulatedOperatorTokensAmount = 0;
                }
                uint256 liquidityAmount = taxAmount.mul(liquidityFee).div(100);
                super._transfer(from, address(this), liquidityAmount);
                _amount = amount.sub(operatorFeeAmount.add(liquidityAmount));
            }                
        }
        // swap and liquify
        if (_isSwappable && /*!_isSelling &&*/ !_isBuying && from != owner) {
            swapAndLiquify();
        }
        super._transfer(from, to, _amount);
    }

    /// @dev Swap tokens for eth
    function swapAndSendToAddress(address destination, uint256 tokens) private transferTaxFree{
        uint256 initialETHBalance = address(this).balance;
        swapTokensForEth(tokens);
        uint256 newBalance = (address(this).balance).sub(initialETHBalance);
        payable(destination).transfer(newBalance);
    }

    /// @dev Swap and liquify
    function swapAndLiquify() private lockTheSwap transferTaxFree {

        uint256 contractTokenBalance = balanceOf(address(this));
        if(contractTokenBalance >= accumulatedOperatorTokensAmount) {
            contractTokenBalance = contractTokenBalance.sub(accumulatedOperatorTokensAmount);
            if (contractTokenBalance >= minAmountToLiquify) {
                
                // only min amount to liquify
                uint256 liquifyAmount = contractTokenBalance;

                // split the liquify amount into halves
                uint256 half = liquifyAmount.div(2);
                uint256 otherHalf = liquifyAmount.sub(half);

                // capture the contract's current ETH balance.
                // this is so that we can capture exactly the amount of ETH that the
                // swap creates, and not make the liquidity event include any ETH that
                // has been manually sent to the contract
                uint256 initialBalance = address(this).balance;
                // swap tokens for ETH
                swapTokensForEth(half);
                // how much ETH did we just swap into?
                uint256 newBalance = address(this).balance.sub(initialBalance);
                // add liquidity
                addLiquidity(otherHalf, newBalance);
                
                emit SwapAndLiquify(half, newBalance, otherHalf);
            }
        }
    }

    /// @dev Swap tokens for eth
    function swapTokensForEth(uint256 tokenAmount) private {
        // generate the GoSwap pair path of token -> weth

        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        // make the swap
        
        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0, // accept any amount of ETH
            path,
            address(this),
            block.timestamp
        );
    }

    

    /// @dev Add liquidity
    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        // approve token transfer to cover all possible scenarios
        _approve(address(this), address(uniswapV2Router), tokenAmount);

        // add the liquidity
        uniswapV2Router.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0, // slippage is unavoidable
            0, // slippage is unavoidable
            owner,
            block.timestamp
        );
        emit LiquidityAdded(tokenAmount, ethAmount);
    }

    /**
     * @dev Update the swap router.
     * Can only be called by the current operator.
     */
    function updateuniswapV2Router(address _router) public onlyOwner {
        uniswapV2Router = IUniswapV2Router02(_router);
        uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory()).getPair(address(this), uniswapV2Router.WETH());
        require(uniswapV2Pair != address(0), "Token::updateuniswapV2Router: Invalid pair address.");
        emit uniswapV2RouterUpdated(msg.sender, address(uniswapV2Router), uniswapV2Pair);
    }

    function claimTokens(address teamWallet) public onlyOwner {
        payable(teamWallet).transfer(address(this).balance);
    }
    
    function claimOtherTokens(address anyToken, address recipient) external onlyOwner() {
        IERC20(anyToken).transfer(recipient, IERC20(anyToken).balanceOf(address(this)));
    }
    
    function clearStuckBalance(address payable account) external onlyOwner() {
        account.transfer(address(this).balance);
    }
}