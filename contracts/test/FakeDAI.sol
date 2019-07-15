// /**
//  *Submitted for verification at Etherscan.io on 2018-04-16
// */

pragma solidity ^0.5.10;

import '../classes/ERC20Detailed.sol';

contract FakeDAI is ERC20Detailed{
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    mapping (address => uint256) private _balances;

    uint256 private _totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() public{
        _name = "FAKE DAI";
        _symbol = "fakeDAI";
        _decimals = 18;
    }

    function mint() public returns (uint256) {
        uint256 amount = 10 * uint256(10)**uint256(_decimals);
        _balances[msg.sender] = _balances[msg.sender] + amount;
        _totalSupply = _totalSupply+amount;
        emit Transfer(address(0), msg.sender, amount);
        return _balances[msg.sender];
    }

    function balanceOf(address account) public view returns(uint256){
        return  _balances[account];
    }

    function totalSupply() public view returns(uint256){
        return _totalSupply;
    }
}