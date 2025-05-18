import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LaunchpadJson from '../contracts/Launchpad.json';
import ProjectTokenJson from '../contracts/ProjectToken.json';

// 定义 ProjectToken 合约的接口
interface ProjectTokenContract extends ethers.BaseContract {
    mint(to: string, amount: bigint): Promise<ethers.ContractTransactionResponse>;
}

export const CreateProject: React.FC = () => {
    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [startDelay, setStartDelay] = useState('1'); // 默认1小时后开始
    const [duration, setDuration] = useState('24'); // 默认持续24小时
    const [maxPerUser, setMaxPerUser] = useState('');
    const [softCap, setSoftCap] = useState('');
    const [hardCap, setHardCap] = useState('');
    const [tokenPerFundingToken, setTokenPerFundingToken] = useState('');
    const [creating, setCreating] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [currentAddress, setCurrentAddress] = useState('');

    useEffect(() => {
        const checkOwner = async () => {
            if (!window.ethereum) return;

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setCurrentAddress(address);

                const launchpadAddress = "0xf13A80D9489BE734769389d98e9FaD8998A73510";
                const launchpad = new ethers.Contract(
                    launchpadAddress,
                    LaunchpadJson.abi,
                    signer
                );

                const owner = await launchpad.owner();
                setIsOwner(owner.toLowerCase() === address.toLowerCase());
            } catch (error) {
                console.error('检查所有者失败:', error);
            }
        };

        checkOwner();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!window.ethereum) {
            alert('请安装 MetaMask!');
            return;
        }

        if (!isOwner) {
            alert('只有合约所有者才能创建项目！');
            return;
        }

        try {
            setCreating(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const launchpadAddress = "0xf13A80D9489BE734769389d98e9FaD8998A73510";
            const launchpad = new ethers.Contract(
                launchpadAddress,
                LaunchpadJson.abi,
                signer
            );

            // 验证代币兑换比例和硬顶的乘积是否小于5亿
            const hardCapWei = ethers.parseEther(hardCap);
            const tokenPerFundingTokenWei = ethers.parseEther(tokenPerFundingToken);
            // 将 wei 转换为普通数字进行计算
            const hardCapNum = Number(ethers.formatEther(hardCapWei));
            const tokenPerFundingTokenNum = Number(ethers.formatEther(tokenPerFundingTokenWei));
            const totalTokens = hardCapNum * tokenPerFundingTokenNum;
            const maxTokens = 500000000; // 5亿

            if (totalTokens > maxTokens) {
                alert(`代币兑换比例乘以硬顶不能超过5亿个代币！当前值：${totalTokens.toLocaleString()} 个代币`);
                return;
            }

            // 1. 部署代币合约
            const factory = new ethers.ContractFactory(
                ProjectTokenJson.abi,
                ProjectTokenJson.bytecode,
                signer
            );
            const projectToken = await factory.deploy(
                tokenName,
                tokenSymbol,
                await signer.getAddress()
            ) as unknown as ProjectTokenContract;
            await projectToken.waitForDeployment();
            const tokenAddress = await projectToken.getAddress();
            console.log("项目代币已部署:", tokenAddress);

            // 2. 铸造10亿个代币给合约
            const mintAmount = ethers.parseEther("1000000000"); // 10亿
            const mintTx = await projectToken.mint(launchpadAddress, mintAmount);
            await mintTx.wait();
            console.log("已铸造10亿个代币给合约");

            // 3. 计算开始和结束时间
            const now = Math.floor(Date.now() / 1000);
            const startTime = now + (Number(startDelay) * 3600); // 转换为秒
            const endTime = startTime + (Number(duration) * 3600); // 转换为秒

            // 4. 创建项目
            const tx = await launchpad.createProject(
                tokenAddress,
                startTime,
                endTime,
                ethers.parseEther(maxPerUser),
                ethers.parseEther(softCap),
                hardCapWei,
                tokenPerFundingTokenWei
            );
            await tx.wait();

            alert('项目创建成功！');
            // 清空表单
            setTokenName('');
            setTokenSymbol('');
            setStartDelay('1');
            setDuration('24');
            setMaxPerUser('');
            setSoftCap('');
            setHardCap('');
            setTokenPerFundingToken('');
        } catch (error) {
            console.error('创建项目失败:', error);
            alert('创建项目失败，请查看控制台了解详情');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="create-project">
            <h2>创建项目</h2>
            {!isOwner && (
                <div style={{ color: 'red', marginBottom: '20px' }}>
                    警告：当前账户 ({currentAddress}) 不是合约所有者，无法创建项目！
                </div>
            )}
            <form onSubmit={handleCreate}>
                <div className="form-group">
                    <label>代币名称:</label>
                    <input
                        type="text"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>代币符号:</label>
                    <input
                        type="text"
                        value={tokenSymbol}
                        onChange={(e) => setTokenSymbol(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>开始时间（几小时后开始）:</label>
                    <input
                        type="number"
                        min="0"
                        value={startDelay}
                        onChange={(e) => setStartDelay(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>持续时间（小时）:</label>
                    <input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>每人最大认购量:</label>
                    <input
                        type="number"
                        value={maxPerUser}
                        onChange={(e) => setMaxPerUser(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>软顶:</label>
                    <input
                        type="number"
                        value={softCap}
                        onChange={(e) => setSoftCap(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>硬顶:</label>
                    <input
                        type="number"
                        value={hardCap}
                        onChange={(e) => setHardCap(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>代币兑换比例:</label>
                    <input
                        type="number"
                        value={tokenPerFundingToken}
                        onChange={(e) => setTokenPerFundingToken(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={creating || !isOwner}>
                    {creating ? '处理中...' : '创建项目'}
                </button>
            </form>
        </div>
    );
};