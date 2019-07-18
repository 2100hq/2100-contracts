pragma solidity ^0.5.10;

contract Ownable{
  address public owner;

  modifier onlyOwner() {
      assert(owner == address(0) || owner == msg.sender);
      _;
  }

  modifier notOwner() {
      require(owner != msg.sender, "2100: Owner cannot call this function");
      _;
  }
}