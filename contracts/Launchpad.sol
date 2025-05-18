// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDex {
    function addLiquidity(uint amountA, uint amountB) external returns (uint);
    function balanceOf(address user) external view returns (uint);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address sender, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Launchpad {
    address public owner;
    IDex public dex;
    IERC20 public fundingToken;

    struct ProjectParams {
        address projectToken;
        uint hoursUntilStart;
        uint durationHours;
        uint maxPerUser;
        uint softCap;
        uint hardCap;
        uint tokenPerFundingToken;
    }

    struct Project {
        address projectToken;
        uint startTime;
        uint endTime;
        uint maxPerUser;
        uint softCap;
        uint hardCap;
        uint totalRaised;
        uint tokenPerFundingToken; // 认购比例：1资金代币 → 几个项目代币
        bool finalized;
        bool isSuccess;
        uint lpUnlockTime;
        bool lpLocked;
        uint lpAmount;
        mapping(address => uint) contributions;
    }

    mapping(uint => Project) public projects;  // 通过项目 ID 来访问每个项目
    uint public projectCount;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier projectExists(uint projectId) {
        require(projectId < projectCount, "Project does not exist");
        _;
    }

    modifier onlyProjectOwner(uint projectId) {
        require(msg.sender == owner, "Not project owner");
        _;
    }

    modifier onlyDuringProject(uint projectId) {
        require(block.timestamp >= projects[projectId].startTime && block.timestamp < projects[projectId].endTime, "Not in project time");
        _;
    }

    modifier isFinalizable(uint projectId) {
        require(block.timestamp >= projects[projectId].endTime && !projects[projectId].finalized, "Not ready to finalize");
        _;
    }

    constructor(address _dex, address _fundingToken) {
        owner = msg.sender;
        dex = IDex(_dex);
        fundingToken = IERC20(_fundingToken);
    }

    // 创建新项目
    function createProject(ProjectParams calldata params) external onlyOwner {
        uint projectId = projectCount++;
        Project storage project = projects[projectId];
        
        project.projectToken = params.projectToken;
        project.startTime = block.timestamp + (params.hoursUntilStart * 1 hours);
        project.endTime = project.startTime + (params.durationHours * 1 hours);
        project.maxPerUser = params.maxPerUser;
        project.softCap = params.softCap;
        project.hardCap = params.hardCap;
        project.tokenPerFundingToken = params.tokenPerFundingToken;
    }

    // 投资者认购
    function subscribe(uint projectId, uint amount) external onlyDuringProject(projectId) projectExists(projectId) {
        Project storage project = projects[projectId];

        require(project.totalRaised + amount <= project.hardCap, "Over hard cap");
        require(project.contributions[msg.sender] + amount <= project.maxPerUser, "Over max per user");

        fundingToken.transferFrom(msg.sender, address(this), amount);
        project.contributions[msg.sender] += amount;
        project.totalRaised += amount;
    }

    // 项目方 finalizing 募资
    function finalize(uint projectId) external isFinalizable(projectId) onlyProjectOwner(projectId) {
        Project storage project = projects[projectId];
        project.finalized = true;

        if (project.totalRaised >= project.softCap) {
            project.isSuccess = true;
            _setupLiquidity(projectId);
        } else {
            project.isSuccess = false;
        }
    }

    // 内部函数，设置流动性
    function _setupLiquidity(uint projectId) private {
        Project storage project = projects[projectId];
        uint fundingLP = project.totalRaised / 2;
        uint tokenLP = fundingLP * project.tokenPerFundingToken;

        // 批准DEX使用代币
        _approveTokens(project.projectToken, tokenLP);
        _approveFunding(fundingLP);

        // 添加流动性
        project.lpAmount = dex.addLiquidity(tokenLP, fundingLP);
        project.lpLocked = true;
        project.lpUnlockTime = block.timestamp + 30 days;
    }

    // 批准项目代币
    function _approveTokens(address token, uint amount) private {
        IERC20(token).approve(address(dex), amount);
    }

    // 批准资金代币
    function _approveFunding(uint amount) private {
        fundingToken.approve(address(dex), amount);
    }

    // 投资者领取代币或退款
    function claimOrRefund(uint projectId) external projectExists(projectId) {
        Project storage project = projects[projectId];
        uint amount = project.contributions[msg.sender];
        require(amount > 0, "Nothing to claim");

        project.contributions[msg.sender] = 0;

        if (project.isSuccess) {
            uint tokenAmount = amount * project.tokenPerFundingToken;
            IERC20(project.projectToken).transfer(msg.sender, tokenAmount);
        } else {
            fundingToken.transfer(msg.sender, amount);
        }
    }

    // 项目方提取未使用的代币
    function withdrawUnusedTokens(uint projectId) external onlyProjectOwner(projectId) {
        Project storage project = projects[projectId];
        require(project.finalized && project.isSuccess, "Only after success");

        uint usedTokens = project.totalRaised * project.tokenPerFundingToken;
        uint balance = IERC20(project.projectToken).balanceOf(address(this));
        
        if (balance > usedTokens) {
            uint excess = balance - usedTokens;
            IERC20(project.projectToken).transfer(owner, excess);
        }
    }

    // 项目方提取 LP
    function withdrawLP(uint projectId) external onlyProjectOwner(projectId) {
        Project storage project = projects[projectId];
        require(project.lpLocked && block.timestamp >= project.lpUnlockTime, "Still locked");
        project.lpLocked = false;

        // 从 DEX 中提走 LP token
        // 实际 LP token 是 dex 合约内部的 balanceOf 记录
        // 我们这里只是逻辑模拟，不涉及真实 LP token 的 transfer
    }
}
