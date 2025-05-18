import { ethers } from "hardhat";
import { Launchpad } from "../typechain-types";

async function main() {
    // 获取签名者
    const [deployer] = await ethers.getSigners();
    console.log("使用账户地址:", deployer.address);

    // 获取已部署的合约
    const launchpad = await ethers.getContractAt("Launchpad", "0xf13A80D9489BE734769389d98e9FaD8998A73510") as Launchpad;

    try {
        // 1. 检查项目状态
        const projectId = 5n; // 指定项目ID
        console.log("\n1. 检查项目状态...");
        const project = await launchpad.projects(projectId);
        console.log("项目代币地址:", project.projectToken);
        console.log("开始时间:", new Date(Number(project.startTime) * 1000).toLocaleString());
        console.log("结束时间:", new Date(Number(project.endTime) * 1000).toLocaleString());
        console.log("软顶:", ethers.formatEther(project.softCap));
        console.log("硬顶:", ethers.formatEther(project.hardCap));
        console.log("当前募集金额:", ethers.formatEther(project.totalRaised));
        console.log("是否已结束:", project.finalized);
        console.log("是否成功:", project.isSuccess);

        // 2. 结束项目
        console.log("\n2. 结束项目...");
        const finalizeTx = await launchpad.finalize(projectId);
        console.log("结束项目交易已发送:", finalizeTx.hash);
        await finalizeTx.wait();
        console.log("项目已结束");

        // 3. 检查最终状态
        console.log("\n3. 检查最终状态...");
        const finalProject = await launchpad.projects(projectId);
        console.log("是否成功:", finalProject.isSuccess);
        console.log("总募集金额:", ethers.formatEther(finalProject.totalRaised));

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