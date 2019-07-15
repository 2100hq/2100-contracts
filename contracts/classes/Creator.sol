pragma solidity ^0.5.10;

import "../utils/Validator.sol";
import "../UsernameToken.sol";

contract Creator is Validator {
  address public owner;
  mapping (string => address) public symbolToToken;
  mapping (address => string) public tokenToSymbol;
  address[] public tokens;

  event Create(string indexed symbol, address indexed token, address creator);

  function create(string memory symbol, bytes32 hash, uint8 v, bytes32 r, bytes32 s)
      public
      onlyUnseenMessage(hash)
      onlyValidSignature(owner, hash, v, r, s)
      returns(bool)
  {
    assert(hash == getCreateHash(symbol));
    assert(isValidSignature(owner, hash, v,r,s));

    address usernameToken = address(new UsernameToken(symbol, symbol));
    symbolToToken[symbol] = usernameToken;
    tokenToSymbol[usernameToken] = symbol;
    tokens.push(usernameToken);

    setSeenMessage(hash);

    return true;
  }

    function tokenLength() public view returns (uint256){
      return tokens.length;
    }

    function getCreateHash(string memory symbol) public pure returns (bytes32 _hash){
        return keccak256(abi.encodePacked("CREATE", symbol));
    }
}