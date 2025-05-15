// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

contract Authentication {
    uint256 public numberOfUsers;

    mapping(address => string) private userHashes;    
    mapping(address => bool) private isRegistered;

    constructor() {
        numberOfUsers = 0;
    }

    function register(string memory _hash) public {
        require(!isRegistered[msg.sender], "User already registered");
        
        userHashes[msg.sender] = _hash;
        isRegistered[msg.sender] = true;
        
        numberOfUsers++;
    }

    function getHash() public view returns (string memory) {
        require(isRegistered[msg.sender], "User not registered");
        return userHashes[msg.sender];
    }

    function isUserRegistered(address userAddress) public view returns (bool) {
        return isRegistered[userAddress];
    }
}