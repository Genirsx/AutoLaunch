import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LaunchpadJson from '../contracts/Launchpad.json';

export const ClaimTokens: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        const loadProjects = async () => {
            if (!window.ethereum) {
                alert('请安装 MetaMask!');
                return;
            }

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const userAddress = await signer.getAddress();
                const launchpadAddress = "0xf13A80D9489BE734769389d98e9FaD8998A73510";
                const launchpad = new ethers.Contract(
                    launchpadAddress,
                    LaunchpadJson.abi,
                    signer
                );

                const count = await launchpad.projectCount();
                const projectList = [];

                for (let i = 0; i < count; i++) {
                    const projectInfo = await launchpad.projects(i);
                    const contribution = await launchpad.contributions(i, userAddress);

                    // 只添加用户有认购的项目
                    if (contribution > 0) {
                        const now = Math.floor(Date.now() / 1000);
                        const isEnded = now > projectInfo.endTime;
                        const reachedSoftCap = projectInfo.totalRaised >= projectInfo.softCap;

                        // 获取代币合约
                        const tokenAbi = [
                            "function balanceOf(address account) view returns (uint256)",
                            "function decimals() view returns (uint8)"
                        ];
                        const tokenContract = new ethers.Contract(
                            projectInfo.projectToken,
                            tokenAbi,
                            provider
                        );

                        // 获取合约中的代币余额
                        const contractBalance = await tokenContract.balanceOf(launchpadAddress);
                        const decimals = await tokenContract.decimals();

                        // 计算用户应得的代币数量
                        const userTokens = (BigInt(contribution) * BigInt(projectInfo.tokenPerFundingToken)) / BigInt(ethers.parseEther("1"));

                        projectList.push({
                            id: i,
                            token: projectInfo.projectToken,
                            startTime: Number(projectInfo.startTime),
                            endTime: Number(projectInfo.endTime),
                            maxPerUser: projectInfo.maxPerUser,
                            softCap: projectInfo.softCap,
                            hardCap: projectInfo.hardCap,
                            tokenPerFundingToken: projectInfo.tokenPerFundingToken,
                            totalRaised: projectInfo.totalRaised,
                            finalized: projectInfo.finalized,
                            contribution: contribution,
                            isEnded,
                            reachedSoftCap,
                            contractBalance,
                            userTokens,
                            decimals
                        });
                    }
                }

                setProjects(projectList);
            } catch (error) {
                console.error('加载项目失败:', error);
                alert('加载项目失败，请查看控制台了解详情');
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, []);

    const handleClaim = async (projectId: number) => {
        if (!window.ethereum) {
            alert('请安装 MetaMask!');
            return;
        }

        try {
            setClaiming(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const launchpadAddress = "0xf13A80D9489BE734769389d98e9FaD8998A73510";
            const launchpad = new ethers.Contract(
                launchpadAddress,
                LaunchpadJson.abi,
                signer
            );

            const tx = await launchpad.claimOrRefund(projectId);
            await tx.wait();

            alert('代币领取成功！');
            // 重新加载项目列表
            window.location.reload();
        } catch (error) {
            console.error('领取代币失败:', error);
            alert('领取代币失败，请查看控制台了解详情');
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return <div>加载中...</div>;
    }

    return (
        <div className="claim-tokens">
            <h2>领取代币</h2>
            <div className="project-list">
                {projects.map((project) => {
                    const hasEnoughBalance = project.contractBalance >= project.userTokens;
                    const canClaim = project.finalized && hasEnoughBalance;

                    return (
                        <div key={project.id} className="project-card">
                            <h3>项目 #{project.id}</h3>
                            <div className="project-info">
                                <p><strong>代币地址:</strong> {project.token}</p>
                                <p><strong>开始时间:</strong> {new Date(project.startTime * 1000).toLocaleString()}</p>
                                <p><strong>结束时间:</strong> {new Date(project.endTime * 1000).toLocaleString()}</p>
                                <p><strong>每人最大认购量:</strong> {ethers.formatEther(project.maxPerUser)}</p>
                                <p><strong>软顶:</strong> {ethers.formatEther(project.softCap)}</p>
                                <p><strong>硬顶:</strong> {ethers.formatEther(project.hardCap)}</p>
                                <p><strong>代币兑换比例:</strong> {ethers.formatEther(project.tokenPerFundingToken)}</p>
                                <p><strong>已筹集:</strong> {ethers.formatEther(project.totalRaised)}</p>
                                <p><strong>您的认购量:</strong> {ethers.formatEther(project.contribution)}</p>
                                <p><strong>项目状态:</strong> {project.finalized ? '已结束' : '进行中'}</p>
                                <p><strong>是否达到软顶:</strong> {project.reachedSoftCap ? '是' : '否'}</p>
                                <p><strong>是否已过期:</strong> {project.isEnded ? '是' : '否'}</p>
                                <p><strong>合约代币余额:</strong> {ethers.formatUnits(project.contractBalance, project.decimals)}</p>
                                <p><strong>您应得的代币:</strong> {ethers.formatUnits(project.userTokens, project.decimals)}</p>
                                <p><strong>是否可以领取:</strong> {canClaim ? '是' : '否'}</p>
                                {!canClaim && (
                                    <p className="error-message">
                                        {!project.finalized ? '项目尚未结束' :
                                            !hasEnoughBalance ? '合约代币余额不足' :
                                                '无法领取'}
                                    </p>
                                )}
                            </div>
                            {canClaim && (
                                <button
                                    onClick={() => handleClaim(project.id)}
                                    disabled={claiming}
                                >
                                    {claiming ? '处理中...' : '领取代币'}
                                </button>
                            )}
                        </div>
                    );
                })}
                {projects.length === 0 && (
                    <p>没有认购的项目</p>
                )}
            </div>
        </div>
    );
}; 