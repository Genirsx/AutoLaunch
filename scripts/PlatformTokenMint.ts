import { ethers } from "hardhat";
import { PlatformToken } from "../typechain-types";

async function main() {
    // 获取部署的合约地址
    const platformTokenAddress = "0xf3649AE6c937eB7348E12E41033A47C3d235Fe58";

    // 获取合约实例
    const platformToken = await ethers.getContractAt("PlatformToken", platformTokenAddress) as PlatformToken;

    // 获取测试账户
    const signers = await ethers.getSigners();
    const owner = signers[0];

    if (!owner) {
        throw new Error("无法获取测试账户");
    }

    console.log("开始测试 PlatformToken 合约...");
    console.log("当前账户地址:", owner.address);

    // 检查合约owner
    const contractOwner = await platformToken.owner();
    console.log("合约Owner地址:", contractOwner);

    if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
        console.log("错误：当前账户不是合约的owner，无法执行mint操作");
        process.exit(1);
    }

    // 铸造代币
    const mintAmount = ethers.parseEther("10000000000000"); // 铸造100000亿个代币
    console.log("\n铸造代币...");
    const mintTx = await platformToken.mint(owner.address, mintAmount);
    await mintTx.wait();
    console.log("铸造成功！铸造数量:", ethers.formatEther(mintAmount));

    // 检查余额
    const ownerBalance = await platformToken.balanceOf(owner.address);
    console.log("Owner余额:", ethers.formatEther(ownerBalance));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 