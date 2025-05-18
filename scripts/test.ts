import { ethers } from "hardhat";
import { Launchpad, ProjectToken } from "../typechain-types";
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20/IERC20";

async function main() {
    // 获取签名者
    const [deployer] = await ethers.getSigners();
    console.log("使用账户地址:", deployer.address);

    // 获取已部署的合约
    const launchpad = await ethers.getContractAt("Launchpad", "0xf13A80D9489BE734769389d98e9FaD8998A73510") as Launchpad;
    const fundingToken = await ethers.getContractAt("IERC20", await launchpad.fundingToken()) as IERC20;

    try {
        // 1. 获取最新项目ID
        const projectCount = await launchpad.projectCount();
        const projectId = projectCount - BigInt(1);
        console.log("测试项目ID:", projectId);

        // 2. 检查项目状态
        console.log("\n1. 检查项目状态...");
        const project = await launchpad.projects(projectId);
        const projectToken = await ethers.getContractAt("ProjectToken", project.projectToken) as ProjectToken;
        console.log("项目代币地址:", project.projectToken);
        console.log("开始时间:", new Date(Number(project.startTime) * 1000).toLocaleString());
        console.log("结束时间:", new Date(Number(project.endTime) * 1000).toLocaleString());
        console.log("软顶:", ethers.formatEther(project.softCap));
        console.log("硬顶:", ethers.formatEther(project.hardCap));
        console.log("当前募集金额:", ethers.formatEther(project.totalRaised));
        console.log("是否已结束:", project.finalized);
        console.log("是否成功:", project.isSuccess);

        // 3. 用户认购
        console.log("\n2. 用户认购...");
        const amount = ethers.parseEther("10000"); // 认购10000个资金代币
        const approveTx = await fundingToken.connect(deployer).approve(await launchpad.getAddress(), amount);
        console.log("授权交易已发送:", approveTx.hash);
        await approveTx.wait();
        console.log("授权成功");

        const subscribeTx = await launchpad.connect(deployer).subscribe(projectId, amount);
        console.log("认购交易已发送:", subscribeTx.hash);
        await subscribeTx.wait();
        console.log("认购成功");

        // 4. 检查认购后的状态
        console.log("\n3. 检查认购后的状态...");
        const updatedProject = await launchpad.projects(projectId);
        console.log("当前募集金额:", ethers.formatEther(updatedProject.totalRaised));
        console.log("用户认购金额:", ethers.formatEther(await launchpad.contributions(projectId, deployer.address)));

        // 5. 检查是否达到硬顶
        console.log("\n4. 检查是否达到硬顶...");
        if (updatedProject.totalRaised >= updatedProject.hardCap) {
            console.log("已达到硬顶，准备结束项目...");

            // 6. 结束项目
            console.log("\n5. 结束项目...");
            const finalizeTx = await launchpad.finalize(projectId);
            console.log("结束项目交易已发送:", finalizeTx.hash);
            await finalizeTx.wait();
            console.log("项目已结束");

            // 7. 检查最终状态
            console.log("\n6. 检查最终状态...");
            const finalProject = await launchpad.projects(projectId);
            console.log("是否成功:", finalProject.isSuccess);
            console.log("总募集金额:", ethers.formatEther(finalProject.totalRaised));

            // 8. 用户领取代币
            console.log("\n7. 用户领取代币...");
            const beforeBalance = await projectToken.balanceOf(deployer.address);
            console.log("领取前代币余额:", ethers.formatEther(beforeBalance));

            const claimTx = await launchpad.connect(deployer).claimOrRefund(projectId);
            console.log("领取代币交易已发送:", claimTx.hash);
            await claimTx.wait();

            const afterBalance = await projectToken.balanceOf(deployer.address);
            console.log("领取后代币余额:", ethers.formatEther(afterBalance));
            console.log("领取数量:", ethers.formatEther(afterBalance - beforeBalance));
        } else {
            console.log("未达到硬顶，等待项目结束...");
            const endTime = Number(updatedProject.endTime);
            console.log("项目将在", new Date(endTime * 1000).toLocaleString(), "结束");
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