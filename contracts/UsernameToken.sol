pragma solidity ^0.5.10;

import "./classes/ERC20.sol";

contract UsernameToken is ERC20 {
    address public accountOwner;

    address public owner;

    string public name;

    string public symbol;

    uint8 public decimals = 18;

    uint256 public maxSupply = 2100 * 10 ** 18;

    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;

    modifier onlyOwner() {
        assert(owner == address(0) || owner == msg.sender);
        _;
    }

    constructor(string memory _name, string memory _symbol) public {
        assert(owner == address(0));
        setOwner(msg.sender);
        setName(_name);
        setSymbol(_symbol);
    }

    function mint(address account, uint256 amount)
        public
        onlyOwner
        returns (bool)
    {
        require(account != address(0), "ERC20: mint to the zero address");
        _totalSupply = _totalSupply.add(amount);
        require(
            _totalSupply <= maxSupply,
            "ERC20: max supply has been reached"
        );
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
        return true;
    }

    function setAccountOwner(address _accountOwner)
        public
        onlyOwner
        returns (bool)
    {
        assert(accountOwner == address(0));
        accountOwner = _accountOwner;
        return true;
    }

    function setOwner(address _owner) public onlyOwner returns (bool) {
        owner = _owner;
        return true;
    }

    function setName(string memory _name) public onlyOwner returns (bool) {
        name = _name;
        return true;
    }

    function setSymbol(string memory _symbol) public onlyOwner returns (bool) {
        symbol = _symbol;
        return true;
    }

    /**
     * @dev See `IERC20.totalSupply`.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See `IERC20.balanceOf`.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
}
