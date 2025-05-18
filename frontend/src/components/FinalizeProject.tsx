import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LaunchpadJson from '../contracts/Launchpad.json';

export const FinalizeProject: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);

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

    const handleFinalize = async (projectId: number) => {
        if (!window.ethereum) {
            alert('请安装 MetaMask!');
            return;
        }

        try {
            setFinalizing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const launchpadAddress = "0xf13A80D9489BE734769389d98e9FaD8998A73510";
            const launchpad = new ethers.Contract(
                launchpadAddress,
                LaunchpadJson.abi,
                signer
            );

            const tx = await launchpad.finalize(projectId);
            await tx.wait();

            alert('项目已结束！');
            // 重新加载项目列表
            window.location.reload();
        } catch (error) {
            console.error('结束项目失败:', error);
            alert('结束项目失败，请查看控制台了解详情');
        } finally {
            setFinalizing(false);
        }
    };

    if (loading) {
        return <div>加载中...</div>;
    }

    const finalizableProjects = projects.filter(project => {
        const now = Math.floor(Date.now() / 1000);
        const isEnded = now > project.endTime;
        const reachedHardCap = project.totalRaised >= project.hardCap;
        return !project.finalized && (isEnded || reachedHardCap);
    });

    return (
        <div className="finalize-project">
            <h2>结束项目</h2>
            <div className="project-list">
                {finalizableProjects.map((project) => {
                    const now = Math.floor(Date.now() / 1000);
                    const isEnded = now > project.endTime;
                    const reachedHardCap = project.totalRaised >= project.hardCap;

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
                                <p><strong>结束原因:</strong> {isEnded ? '时间已到' : '已达到硬顶'}</p>
                            </div>
                            <button
                                onClick={() => handleFinalize(project.id)}
                                disabled={finalizing}
                            >
                                {finalizing ? '处理中...' : '结束项目'}
                            </button>
                        </div>
                    );
                })}
                {finalizableProjects.length === 0 && (
                    <p>没有可以结束的项目</p>
                )}
            </div>
        </div>
    );
}; 