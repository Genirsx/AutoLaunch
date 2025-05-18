import { ethers } from "hardhat";
import { Launchpad, ProjectToken } from "../typechain-types";

async function main() {
    // 获取签名者
    const [deployer] = await ethers.getSigners();
    console.log("使用账户地址:", deployer.address);

    // 获取已部署的合约
    const launchpad = await ethers.getContractAt("Launchpad", "0xf13A80D9489BE734769389d98e9FaD8998A73510") as Launchpad;
    const projectToken = await ethers.getContractAt("ProjectToken", "0xa9126F6e2C5d0DCFB3b298B29Db0f3350b9f5cB0") as ProjectToken;

    try {
        // 1. 部署新的项目代币
        console.log("\n1. 部署新的项目代币...");
        const ProjectToken = await ethers.getContractFactory("ProjectToken");
        const newProjectToken = await ProjectToken.deploy(
            "Test Project Token",
            "TPT",
            deployer.address
        );
        await newProjectToken.waitForDeployment();
        console.log("新项目代币已部署到:", await newProjectToken.getAddress());

        // 2. 设置项目参数
        console.log("\n2. 设置项目参数...");
        const now = Math.floor(Date.now() / 1000);
        const startTime = now ; // 1分钟后开始
        const endTime = startTime + 120; // 持续10分钟
        const maxPerUser = ethers.parseEther("10000"); // 每人最多认购10000个
        const softCap = ethers.parseEther("1000"); // 软顶1000个
        const hardCap = ethers.parseEther("10000"); // 硬顶10000个
        const tokenPerFundingToken = ethers.parseEther("100"); // 每个资金代币兑换100个项目代币

        // 3. 创建项目
        console.log("\n3. 创建项目...");
        const createTx = await launchpad.createProject(
            await newProjectToken.getAddress(),
            startTime,
            endTime,
            maxPerUser,
            softCap,
            hardCap,
            tokenPerFundingToken
        );
        console.log("创建项目交易已发送:", createTx.hash);
        await createTx.wait();
        console.log("项目创建成功");

        // 4. 获取项目ID
        const projectCount = await launchpad.projectCount();
        const projectId = projectCount - BigInt(1);
        console.log("项目ID:", projectId);

        // 5. 铸造项目代币给 Launchpad
        console.log("\n5. 铸造项目代币给 Launchpad...");
        const mintAmount = ethers.parseEther("1000000"); // 铸造100万个代币
        const mintTx = await newProjectToken.mint(await launchpad.getAddress(), mintAmount);
        console.log("铸造交易已发送:", mintTx.hash);
        await mintTx.wait();
        console.log("已铸造", ethers.formatEther(mintAmount), "个代币给 Launchpad");

        // 6. 检查项目状态
        console.log("\n6. 检查项目状态...");
        const project = await launchpad.projects(projectId);
        console.log("项目代币地址:", project.projectToken);
        console.log("开始时间:", new Date(Number(project.startTime) * 1000).toLocaleString());
        console.log("结束时间:", new Date(Number(project.endTime) * 1000).toLocaleString());
        console.log("每人最多认购:", ethers.formatEther(project.maxPerUser));
        console.log("软顶:", ethers.formatEther(project.softCap));
        console.log("硬顶:", ethers.formatEther(project.hardCap));
        console.log("代币兑换比例:", ethers.formatEther(project.tokenPerFundingToken));
        console.log("是否已结束:", project.finalized);
        console.log("是否成功:", project.isSuccess);

    } catch (error: any) {
        console.error("操作失败:", error);
        if (error.data) {
            console.error("错误数据:", error.data);
        }
        if (error.reason) {
            console.error("错误原因:", error.reason);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error: any) => {
        console.error(error);
        process.exit(1);
    }); 