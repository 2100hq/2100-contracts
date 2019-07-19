pragma solidity ^0.5.10;

import "../utils/Validator.sol";
import "../UsernameToken.sol";

contract Creator is Validator {

  mapping (string => address) public usernameToToken;
  mapping (address => string) public tokenToUsername;
  address[] public tokens;
  address BLACKLIST_ADDRESS = address(1);

  event Create(bytes32 messageId, string username, address token, address creator);

  // modifier onlyWhitelisted(string memory username){
  //   require(usernameToToken[username] != BLACKLIST_ADDRESS, '2100: Username has been blacklisted');
  //   _;
  // }

  function create(string memory username, bytes32 messageId, uint8 v, bytes32 r, bytes32 s)
      public
      onlyUnseenMessage(messageId)
      onlyValidSignature(owner, messageId, v, r, s)
      // onlyWhitelisted(username)
      returns(address)
  {
    require(messageId == getCreateMessageId(username), '2100: messageId is invalid');

    address token = address(new UsernameToken(username, username));
    usernameToToken[username] = token;
    tokenToUsername[token] = username;
    tokens.push(token);

    emit Create(messageId, username, token, msg.sender);

    return token;
  }

    function tokensLength() public view returns (uint256){
      return tokens.length;
    }

    function getCreateMessageId(string memory username) public pure returns (bytes32){
        return keccak256(abi.encodePacked("CREATE", username));
    }
}