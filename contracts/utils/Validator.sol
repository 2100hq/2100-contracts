pragma solidity ^0.5.10;

import "../libraries/ECDSA.sol";

contract Validator{
  using ECDSA for bytes32;

    mapping (bytes32 => uint) public messageIdToBlockNumber;

    modifier onlyUnseenMessage(bytes32 messageId){
      assert(seenMessage(messageId) == false);
      _;
    }

    modifier onlyValidSignature(address signer, bytes32 hash, uint8 v, bytes32 r, bytes32 s){
      assert(isValidSignature(signer, hash, v,r,s));
      _;
    }

    function seenMessage(bytes32 messageId) public view returns (bool _seen) {
      return messageIdToBlockNumber[messageId] > 0;
    }

    function setSeenMessage(bytes32 messageId) internal{
      messageIdToBlockNumber[messageId] = block.number;
    }


    function isValidSignature(address signer, bytes32 hash, uint8 v, bytes32 r, bytes32 s) public pure returns (bool _valid)
    {
        return signer == hash.toEthSignedMessageHash().recover(v, r, s);
    }

    function isValidSignature(address signer, bytes32 hash, bytes memory signature) public pure returns (bool _valid)
    {
        return signer == hash.toEthSignedMessageHash().recover(signature);
    }
}