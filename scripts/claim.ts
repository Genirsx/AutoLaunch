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
        // 1. 检查项目状态
        const projectId = 5n; // 指定项目ID
        console.log("\n1. 检查项目状态...");
        const project = await launchpad.projects(projectId);
        const projectToken = await ethers.getContractAt("ProjectToken", project.projectToken) as ProjectToken;
        console.log("项目代币地址:", project.projectToken);
        console.log("是否已结束:", project.finalized);
        console.log("是否成功:", project.isSuccess);
        console.log("用户认购金额:", ethers.formatEther(await launchpad.contributions(projectId, deployer.address)));

        // 2. 检查当前余额
        console.log("\n2. 检查当前余额...");
        const fundingBalance = await fundingToken.balanceOf(deployer.address);
        console.log("资金代币余额:", ethers.formatEther(fundingBalance));
        const projectBalance = await projectToken.balanceOf(deployer.address);
        console.log("项目代币余额:", ethers.formatEther(projectBalance));

        // 3. 领取退款/代币
        console.log("\n3. 领取退款/代币...");
        const claimTx = await launchpad.connect(deployer).claimOrRefund(projectId);
        console.log("领取交易已发送:", claimTx.hash);
        await claimTx.wait();
        console.log("领取成功");

        // 4. 检查领取后的余额
        console.log("\n4. 检查领取后的余额...");
        const newFundingBalance = await fundingToken.balanceOf(deployer.address);
        console.log("资金代币余额:", ethers.formatEther(newFundingBalance));
        const newProjectBalance = await projectToken.balanceOf(deployer.address);
        console.log("项目代币余额:", ethers.formatEther(newProjectBalance));

        // 5. 显示变化
        console.log("\n5. 余额变化...");
        if (project.isSuccess) {
            console.log("项目成功，获得项目代币:", ethers.formatEther(newProjectBalance - projectBalance));
        } else {
            console.log("项目失败，获得退款:", ethers.formatEther(newFundingBalance - fundingBalance));
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