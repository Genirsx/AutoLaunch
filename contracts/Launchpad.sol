// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Launchpad {
    address public immutable owner;
    IERC20 public immutable fundingToken;

    struct ProjectInfo {
        address projectToken;
        uint startTime;
        uint endTime;
        uint maxPerUser;
        uint softCap;
        uint hardCap;
        uint totalRaised;
        uint tokenPerFundingToken;
        bool finalized;
        bool isSuccess;
    }

    mapping(uint => ProjectInfo) public projects;
    mapping(uint => mapping(address => uint)) public contributions;
    uint public projectCount;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier projectExists(uint projectId) {
        require(projectId < projectCount, "Project does not exist");
        _;
    }

    constructor(address _fundingToken) {
        owner = msg.sender;
        fundingToken = IERC20(_fundingToken);
    }

    function createProject(
        address projectToken,
        uint startTime,
        uint endTime,
        uint maxPerUser,
        uint softCap,
        uint hardCap,
        uint tokenPerFundingToken
    ) external onlyOwner {
        uint projectId = projectCount++;
        projects[projectId] = ProjectInfo({
            projectToken: projectToken,
            startTime: startTime,
            endTime: endTime,
            maxPerUser: maxPerUser,
            softCap: softCap,
            hardCap: hardCap,
            totalRaised: 0,
            tokenPerFundingToken: tokenPerFundingToken,
            finalized: false,
            isSuccess: false
        });
    }

    function subscribe(uint projectId, uint amount) external projectExists(projectId) {
        ProjectInfo storage project = projects[projectId];
        require(block.timestamp >= project.startTime && block.timestamp < project.endTime, "Not in project time");
        require(project.totalRaised + amount <= project.hardCap, "Over hard cap");
        require(contributions[projectId][msg.sender] + amount <= project.maxPerUser, "Over max per user");

        fundingToken.transferFrom(msg.sender, address(this), amount);
        contributions[projectId][msg.sender] += amount;
        project.totalRaised += amount;
    }

    function finalize(uint projectId) external onlyOwner projectExists(projectId) {
        ProjectInfo storage project = projects[projectId];
        require(!project.finalized, "Already finalized");
        require(block.timestamp >= project.endTime || project.totalRaised >= project.hardCap, "Not ready to finalize");

        project.finalized = true;
        if (project.totalRaised >= project.softCap) {
            project.isSuccess = true;
        } else {
            project.isSuccess = false;
        }
    }

    function claimOrRefund(uint projectId) external projectExists(projectId) {
        ProjectInfo storage project = projects[projectId];
        require(project.finalized, "Project not finalized");
        uint amount = contributions[projectId][msg.sender];
        require(amount > 0, "Nothing to claim");

        contributions[projectId][msg.sender] = 0;

        if (project.isSuccess) {
            uint tokenAmount = (amount * project.tokenPerFundingToken) / 1e18;
            IERC20(project.projectToken).transfer(msg.sender, tokenAmount);
        } else {
            fundingToken.transfer(msg.sender, amount);
        }
    }
}