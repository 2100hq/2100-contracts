pragma solidity ^0.5.10;

import '../classes/Ownable.sol';

contract Validator is Ownable {

    mapping (bytes32 => uint) public messageIdToBlockNumber;

    modifier onlyUnseenMessage(bytes32 messageId){
      require(seenMessage(messageId) == false, '2100: this message has aleady been process');
      _;
    }

    modifier onlyValidSignature(address signer, bytes32 hash, uint8 v, bytes32 r, bytes32 s){
      require(signer != address(0), 'signer is 0');
      require(owner != address(0), 'owner is 0');
      require(isValidSignature(signer, hash, v,r,s), '2100: invalid signature');
      _;
    }

    function seenMessage(bytes32 messageId) public view returns (bool) {
      return messageIdToBlockNumber[messageId] > 0;
    }

    function setSeenMessage(bytes32 messageId) internal{
      messageIdToBlockNumber[messageId] = block.number;
    }


    function isValidSignature(address signer, bytes32 hash, uint8 v, bytes32 r, bytes32 s) public pure returns (bool)
    {
        return signer == recoverEthSignedMessage(hash, v,r,s);
    }

    function recoverEthSignedMessage(bytes32 hash, uint8 v, bytes32 r, bytes32 s) public pure returns(address){
      return ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)), v, r, s);
    }
}