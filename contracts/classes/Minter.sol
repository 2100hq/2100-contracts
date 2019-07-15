pragma solidity ^0.5.10;

import "../utils/Validator.sol";
import "../UsernameToken.sol";

contract Minter is Validator {

    address public owner;

    event Mint(address indexed token, address indexed account, uint256 amount, bytes32 hash);

    function mint(address token, uint amount, uint salt, bytes32 hash, uint8 v, bytes32 r, bytes32 s)
        public
        onlyUnseenMessage(hash)
        onlyValidSignature(owner, hash, v, r, s)
        returns(bool)
    {
        assert(hash == getMintHash(token, msg.sender, amount, salt)); // details and hash match
        assert(isValidSignature(owner, hash, v,r,s)); // owner signed this message
        assert(UsernameToken(token).mint(msg.sender, amount));
        setSeenMessage(hash);
        emit Mint(token, msg.sender, amount, hash);
        return true;
    }

    function getMintHash(address token, address account, uint amount, uint salt) public pure returns (bytes32 _hash){
        return keccak256(abi.encodePacked("MINT", token, account, amount, salt));
    }

}