pragma solidity ^0.5.10;

import "./libraries/SafeMath.sol";
import "./classes/ERC20.sol";
import "./classes/Claimer.sol";
import "./classes/Minter.sol";
import "./classes/Creator.sol";

contract Controller is Claimer, Minter, Creator {
    using SafeMath for uint256;

    uint256 public minDeposit = 10 ** 16; // 0.01 DAI

    event Deposit(address indexed account, uint256 amount, uint256 balance);
    event Withdraw(address indexed account, uint256 amount, uint256 balance);
    event Owner(address indexed owner);
    event DAIAddress(address indexed daiAddress);

    mapping(address => uint256) private _balances;

    ERC20 public DAI;

    address public owner;

    modifier onlyOwner() {
        assert(owner == address(0) || owner == msg.sender);
        _;
    }

    modifier notOwner() {
        require(owner != msg.sender, "2100: Owner cannot call this function");
        _;
    }

    constructor(address daiAddress) public {
        setOwner(msg.sender);
        setDaiAddress(daiAddress);
    }

    function setOwner(address _address) public onlyOwner returns (bool) {
        owner = _address;
        emit Owner(_address);
        return true;
    }

    function setDaiAddress(address daiAddress) public onlyOwner returns (bool) {
        assert(daiAddress != address(0));
        DAI = ERC20(daiAddress);
        emit DAIAddress(daiAddress);
        return true;
    }

    function deposit(uint256 _amount) public notOwner returns (bool) {
        uint256 amount = floor(_amount); // cut of greater than 2 decimal places

        require(
            amount > 0,
            "2100: Amount too small to deposit; Requires at least 0.01 DAI"
        );
        require(
            DAI.allowance(msg.sender, address(this)) >= amount,
            "2100: Controller does not have enough allowance granted"
        );
        require(
            DAI.balanceOf(msg.sender) >= amount,
            "2100: Sender does not have sufficient balance to deposit"
        );
        require(
            DAI.balanceOf(msg.sender) > 0,
            "2100: Sender balance cannot be zero"
        );

        require(
            DAI.transferFrom(msg.sender, address(this), amount),
            "2100: DAI transfer failed"
        );

        _balances[msg.sender] = _balances[msg.sender].add(amount);
        emit Deposit(msg.sender, amount, _balances[msg.sender]);
        return true;
    }

    function withdraw(uint256 amount) public notOwner returns (bool) {
        require(
            _balances[msg.sender] >= amount,
            "2100: Sender does not have enough deposited to withdraw"
        );
        require(
            DAI.balanceOf(address(this)) >= amount,
            "2100: Controller does not have enough balance to withdraw"
        );

        require(
            DAI.transfer(msg.sender, amount),
            "2100: Transfer from Controller to Sender failed"
        );

        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        emit Withdraw(msg.sender, amount, _balances[msg.sender]);
        return true;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function floor(uint256 amount) internal view returns (uint256) {
        return amount.sub(amount.mod(minDeposit));
    }

}
