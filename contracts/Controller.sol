pragma solidity ^0.5.10;

import './libraries/SafeMath.sol';
import './classes/ERC20.sol';
import './classes/Claimer.sol';
import './classes/Minter.sol';
import './classes/Creator.sol';

contract Controller is Claimer, Minter, Creator{
    using SafeMath for uint256;

    event Deposit(address indexed account, uint256 amount, uint256 balance);
    event Withdraw(address indexed account, uint256 amount, uint256 balance);
    event Owner(address indexed owner);
    event DAIAddress(address indexed daiAddress);

    mapping (address => uint) private _balances;

    ERC20 public DAI;

    address public owner;

    modifier onlyOwner(){
        assert(owner == address(0) || owner == msg.sender);
        _;
    }

    constructor(address daiAddress) public {
        setOwner(msg.sender);
        setDaiAddress(daiAddress);
    }

    function setOwner(address _address) onlyOwner public  returns (bool) {
        owner = _address;
        emit Owner(_address);
        return true;
    }

    function setDaiAddress(address daiAddress) onlyOwner public returns (bool) {
        assert(daiAddress != address(0));
        DAI = ERC20(daiAddress);
        emit DAIAddress(daiAddress);
        return true;
    }

    function deposit(uint256 amount) public returns (bool) {
        amount = amount - amount.mod(10**16); // only accept pennies or greater
        require(amount > 0, "Amount too small to deposit");
        assert(DAI.transferFrom(msg.sender, address(this), amount));
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        emit Deposit(msg.sender, amount, _balances[msg.sender]);
        return true;
    }

    function withdraw(uint amount) public returns (bool) {
        assert(_balances[msg.sender] <= amount);
        assert(DAI.transfer(msg.sender, amount));
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        emit Withdraw(msg.sender, amount, _balances[msg.sender]);
        return true;
    }

    function balanceOf(address account) public view returns (uint){
        return _balances[account];
    }
}