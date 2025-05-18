import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LaunchpadJson from '../contracts/Launchpad.json';

export const SubscribeProject: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        const loadProjects = async () => {
            if (!window.ethereum) {
                alert('请安装 MetaMask!');
                return;
            }

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
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
                        finalized: projectInfo.finalized
                    });
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

    const handleApprove = async () => {
        if (!selectedProject || !amount) {
            alert('请选择项目并输入认购数量');
            return;
        }

        if (!window.ethereum) {
            alert('请安装 MetaMask!');
            return;
        }

        try {
            setApproving(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const launchpadAddress = "0xf13A80D9489BE734769389d98e9FaD8998A73510";
            const launchpad = new ethers.Contract(
                launchpadAddress,
                LaunchpadJson.abi,
                signer
            );

            // 获取 fundingToken 地址
            const fundingTokenAddress = await launchpad.fundingToken();

            // 创建 fundingToken 合约实例
            const tokenAbi = [
                "function approve(address spender, uint256 amount) public returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)"
            ];
            const tokenContract = new ethers.Contract(
                fundingTokenAddress,
                tokenAbi,
                signer
            );

            const amountWei = ethers.parseEther(amount);
            const tx = await tokenContract.approve(launchpadAddress, amountWei);
            await tx.wait();

            alert('授权成功！');
        } catch (error) {
            console.error('授权失败:', error);
            alert('授权失败，请查看控制台了解详情');
        } finally {
            setApproving(false);
        }
    };

    const handleSubscribe = async () => {
        if (!selectedProject || !amount) {
            alert('请选择项目并输入认购数量');
            return;
        }

        if (!window.ethereum) {
            alert('请安装 MetaMask!');
            return;
        }

        try {
            setSubscribing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const launchpadAddress = "0xf13A80D9489BE734769389d98e9FaD8998A73510";
            const launchpad = new ethers.Contract(
                launchpadAddress,
                LaunchpadJson.abi,
                signer
            );

            const amountWei = ethers.parseEther(amount);
            const tx = await launchpad.subscribe(selectedProject, amountWei);
            await tx.wait();

            alert('认购成功！');
            setAmount('');
        } catch (error) {
            console.error('认购失败:', error);
            alert('认购失败，请查看控制台了解详情');
        } finally {
            setSubscribing(false);
        }
    };

    if (loading) {
        return <div>加载中...</div>;
    }

    const activeProjects = projects.filter(project => {
        const now = Math.floor(Date.now() / 1000);
        return !project.finalized && now >= project.startTime && now <= project.endTime;
    });

    return (
        <div className="subscribe-project">
            <h2>认购项目</h2>
            <div className="project-list">
                {activeProjects.map((project) => (
                    <div
                        key={project.id}
                        className={`project-card ${selectedProject === project.id ? 'selected' : ''}`}
                        onClick={() => setSelectedProject(project.id)}
                    >
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
                        </div>
                    </div>
                ))}
            </div>

            {selectedProject !== null && (
                <div className="subscribe-form">
                    <h3>认购数量</h3>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="输入认购数量"
                    />
                    <div className="button-group">
                        <button
                            onClick={handleApprove}
                            disabled={approving}
                        >
                            {approving ? '授权中...' : '授权代币'}
                        </button>
                        <button
                            onClick={handleSubscribe}
                            disabled={subscribing}
                        >
                            {subscribing ? '认购中...' : '确认认购'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}; 