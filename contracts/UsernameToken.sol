pragma solidity ^0.5.10;

import './classes/ERC20.sol';

contract UsernameToken is ERC20{
    mapping (address => uint256) private _balances;

    address public accountOwner;

    address private _owner;

    string private _name;

    string private _symbol;

    uint8 private _decimals = 18;

    uint256 private _totalSupply;

    uint256 public maxSupply = 2100*10**18;

    modifier onlyOwner(){
        assert(_owner == address(0) || _owner == msg.sender);
        _;
    }

    constructor(string memory name, string memory symbol) public{
        assert(_owner == address(0));
        setOwner(msg.sender);
        setName(name);
        setSymbol(symbol);
    }

    function mint(address account, uint256 amount) public onlyOwner returns (bool){
        require(account != address(0), "ERC20: mint to the zero address");
        uint256 newTotalSupply = _totalSupply.add(amount);
        assert(newTotalSupply <= maxSupply);
        _totalSupply = newTotalSupply;
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }


    function setAccountOwner(address _accountOwner) public onlyOwner returns (bool){
        assert(accountOwner == address(0));
        accountOwner=_accountOwner;
        return true;
    }

    function setOwner(address owner) public onlyOwner returns (bool){
        _owner = owner;
        return true;
    }

    function setName(string memory name) public onlyOwner returns (bool){
        _name = name;
        return true;
    }

    function setSymbol(string memory symbol) public onlyOwner returns (bool){
        _symbol = symbol;
        return true;
    }

    function owner() public view returns (address){
        return _owner;
    }
}