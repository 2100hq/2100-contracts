pragma solidity ^0.5.10;

import "../utils/Validator.sol";
import "../UsernameToken.sol";

contract Claimer is Validator {

    address public admin;

    event AccountOwnerClaim(address indexed token, address indexed accountOwner, bytes32 hash);

    mapping (bytes32 => uint) public signedMessages;

    mapping (address => address) public tokenToAccountOwner;

    function isAccountOwnerClaimed(address token) public view returns (bool){
        return tokenToAccountOwner[token] != address(0);
    }

    function claim(address token, address accountOwner, bytes32 hash, uint8 v, bytes32 r, bytes32 s)
        public
        onlyUnseenMessage(hash)
        onlyValidSignature(admin, hash, v, r, s)
        returns(bool)
    {
        assert(tokenToAccountOwner[token] == address(0));
        assert(hash == getClaimHash(token, accountOwner)); // details and hash match
        assert(UsernameToken(token).setAccountOwner(accountOwner));
        setSeenMessage(hash);
        tokenToAccountOwner[token] = accountOwner;
        emit AccountOwnerClaim(token, accountOwner, hash);
        return true;
    }

    function getClaimHash(address token, address accountOwner) public pure returns (bytes32 _hash){
        return keccak256(abi.encodePacked("CLAIM", token, accountOwner));
    }

}