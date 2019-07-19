pragma solidity ^0.5.10;

import "../utils/Validator.sol";
import "../UsernameToken.sol";

contract Creator is Validator {

  mapping (string => address) public usernameToToken;
  mapping (address => string) public tokenToUsername;
  address[] public tokens;
  address BLACKLIST_ADDRESS = address(1);

  event Create(bytes32 indexed hash, string username, address token, address creator);

  // modifier onlyWhitelisted(string memory username){
  //   require(usernameToToken[username] != BLACKLIST_ADDRESS, '2100: Username has been blacklisted');
  //   _;
  // }

  function create(string memory username, bytes32 hash, uint8 v, bytes32 r, bytes32 s)
      public
      onlyUnseenMessage(hash)
      onlyValidSignature(owner, hash, v, r, s)
      // onlyWhitelisted(username)
      returns(address)
  {
    require(hash == getCreateHash(username), '2100: Signed hash is not correct');

    address token = address(new UsernameToken(username, username));
    usernameToToken[username] = token;
    tokenToUsername[token] = username;
    tokens.push(token);

    setSeenMessage(hash);

    emit Create(hash, username, token, msg.sender);

    return token;
  }

    function tokensLength() public view returns (uint256){
      return tokens.length;
    }

    function getCreateHash(string memory username) public pure returns (bytes32 _hash){
        return keccak256(abi.encodePacked("CREATE", username));
    }
}