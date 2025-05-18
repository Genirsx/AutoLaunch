import { ethers } from "hardhat";
import { Launchpad } from "../typechain-types";

async function main() {
    // 获取签名者
    const [deployer] = await ethers.getSigners();
    console.log("使用账户地址:", deployer.address);

    // 获取已部署的合约
    const launchpad = await ethers.getContractAt("Launchpad", "0xf13A80D9489BE734769389d98e9FaD8998A73510") as Launchpad;

    try {
        // 1. 获取项目总数
        const projectCount = await launchpad.projectCount();
        console.log("\n项目总数:", projectCount.toString());

        // 2. 遍历所有项目
        for (let i = 0; i < Number(projectCount); i++) {
            const projectId = BigInt(i);
            console.log(`\n项目 #${i + 1}:`);

            // 获取项目信息
            const project = await launchpad.projects(projectId);

            // 获取当前用户的认购金额
            const userContribution = await launchpad.contributions(projectId, deployer.address);

            // 打印项目详情
            console.log("项目ID:", projectId.toString());
            console.log("项目代币:", project.projectToken);
            console.log("开始时间:", new Date(Number(project.startTime) * 1000).toLocaleString());
            console.log("结束时间:", new Date(Number(project.endTime) * 1000).toLocaleString());
            console.log("软顶:", ethers.formatEther(project.softCap));
            console.log("硬顶:", ethers.formatEther(project.hardCap));
            console.log("当前募集金额:", ethers.formatEther(project.totalRaised));
            console.log("是否已结束:", project.finalized);
            console.log("是否成功:", project.isSuccess);
            console.log("当前用户认购金额:", ethers.formatEther(userContribution));

            // 计算进度
            const progress = (Number(project.totalRaised) / Number(project.hardCap)) * 100;
            console.log("募集进度:", progress.toFixed(2) + "%");

            // 计算剩余时间
            const now = Math.floor(Date.now() / 1000);
            const endTime = Number(project.endTime);
            if (now < endTime) {
                const remainingTime = endTime - now;
                const hours = Math.floor(remainingTime / 3600);
                const minutes = Math.floor((remainingTime % 3600) / 60);
                console.log("剩余时间:", hours + "小时" + minutes + "分钟");
            } else {
                console.log("项目已结束");
            }

            console.log("----------------------------------------");
        }

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