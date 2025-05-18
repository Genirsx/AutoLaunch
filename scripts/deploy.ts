import { ethers } from "hardhat";

async function deployWithRetry(factory: any, args: any[] = [], retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const contract = await factory.deploy(...args);
            await contract.waitForDeployment();
            return contract;
        } catch (error: any) {
            console.log(`第 ${i + 1} 次部署失败:`, error.message);
            if (i < retries - 1) {
                console.log("等待 5 秒后重试...");
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                throw error;
            }
        }
    }
}

async function main() {
    console.log("开始部署合约...");
    const [deployer] = await ethers.getSigners();
    console.log("使用账户:", deployer.address);

    // 使用已有的资金代币地址
    const fundingTokenAddress = "0xf3649AE6c937eB7348E12E41033A47C3d235Fe58";
    console.log("使用资金代币地址:", fundingTokenAddress);

    // 部署 ProjectToken
    console.log("\n部署 ProjectToken...");
    const ProjectToken = await ethers.getContractFactory("ProjectToken");
    const projectToken = await deployWithRetry(ProjectToken, [
        "Test Token",
        "TEST",
        deployer.address
    ]);
    console.log("ProjectToken 已部署到:", await projectToken.getAddress());

    // 部署 Launchpad
    console.log("\n部署 Launchpad...");
    const Launchpad = await ethers.getContractFactory("Launchpad");
    const launchpad = await deployWithRetry(Launchpad, [fundingTokenAddress]);
    console.log("Launchpad 已部署到:", await launchpad.getAddress());

    // 创建第一个项目
    console.log("\n创建第一个项目...");
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 60; // 1分钟后开始
    const endTime = startTime + 24 * 60 * 60; // 持续24小时

    const tx = await launchpad.createProject(
        await projectToken.getAddress(),
        startTime,
        endTime,
        ethers.parseEther("10000"), // 每人最多认购
        ethers.parseEther("1000"), // 软顶
        ethers.parseEther("10000"), // 硬顶
        ethers.parseEther("100") // 每个资金代币兑换100个项目代币
    );
    console.log("创建项目交易已发送:", tx.hash);
    await tx.wait();
    console.log("项目创建成功");

    // 获取项目ID
    const projectCount = await launchpad.projectCount();
    const projectId = projectCount - BigInt(1);
    console.log("项目ID:", projectId);

    // 铸造一些项目代币给 Launchpad
    console.log("\n铸造项目代币给 Launchpad...");
    const mintAmount = ethers.parseEther("1000000"); // 铸造100万个代币
    await projectToken.mint(await launchpad.getAddress(), mintAmount);
    console.log("已铸造", ethers.formatEther(mintAmount), "个代币给 Launchpad");

    console.log("\n部署完成！");
    console.log("ProjectToken:", await projectToken.getAddress());
    console.log("Launchpad:", await launchpad.getAddress());
    console.log("FundingToken:", fundingTokenAddress);
    console.log("项目ID:", projectId);
    console.log("\n项目开始时间:", new Date(Number(startTime) * 1000).toLocaleString());
    console.log("项目结束时间:", new Date(Number(endTime) * 1000).toLocaleString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("部署失败:", error);
        process.exit(1);
    });