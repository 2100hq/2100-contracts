pragma solidity ^0.5.10;

import "../utils/Validator.sol";
import "../UsernameToken.sol";

contract Minter is Validator {

    event Mint(address token, address account, uint256 amount, bytes32 messageId);

    function mint(address token, uint amount, uint salt, bytes32 messageId, uint8 v, bytes32 r, bytes32 s)
        public
        onlyUnseenMessage(messageId)
        onlyValidSignature(owner, messageId, v, r, s)
        returns(bool)
    {
        require(messageId == getMintMessageId(token, msg.sender, amount, salt), '2100: messageId is invalid'); // details and messageId match

        require(UsernameToken(token).mint(msg.sender, amount), '2100: Minting token failed');

        emit Mint(token, msg.sender, amount, messageId);
        return true;
    }

    function getMintMessageId(address token, address account, uint amount, uint salt) public pure returns (bytes32){
        return keccak256(abi.encodePacked("MINT", token, account, amount, salt));
    }

}