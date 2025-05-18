import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LaunchpadJson from '../contracts/Launchpad.json';

export const ViewProjects: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

                // 获取项目数量
                const count = await launchpad.projectCount();
                const projectList = [];

                // 获取每个项目的信息
                for (let i = 0; i < count; i++) {
                    const projectInfo = await launchpad.projects(i);
                    projectList.push({
                        id: i,
                        token: projectInfo.projectToken,
                        startTime: new Date(Number(projectInfo.startTime) * 1000).toLocaleString(),
                        endTime: new Date(Number(projectInfo.endTime) * 1000).toLocaleString(),
                        maxPerUser: ethers.formatEther(projectInfo.maxPerUser),
                        softCap: ethers.formatEther(projectInfo.softCap),
                        hardCap: ethers.formatEther(projectInfo.hardCap),
                        tokenPerFundingToken: ethers.formatEther(projectInfo.tokenPerFundingToken),
                        totalRaised: ethers.formatEther(projectInfo.totalRaised),
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

    if (loading) {
        return <div>加载中...</div>;
    }

    return (
        <div className="view-projects">
            <h2>项目列表</h2>
            <div className="project-list">
                {projects.map((project) => (
                    <div key={project.id} className="project-card">
                        <h3>项目 #{project.id}</h3>
                        <div className="project-info">
                            <p><strong>代币地址:</strong> {project.token}</p>
                            <p><strong>开始时间:</strong> {project.startTime}</p>
                            <p><strong>结束时间:</strong> {project.endTime}</p>
                            <p><strong>每人最大认购量:</strong> {project.maxPerUser}</p>
                            <p><strong>软顶:</strong> {project.softCap}</p>
                            <p><strong>硬顶:</strong> {project.hardCap}</p>
                            <p><strong>代币兑换比例:</strong> {project.tokenPerFundingToken}</p>
                            <p><strong>已筹集:</strong> {project.totalRaised}</p>
                            <p><strong>状态:</strong> {project.finalized ? '已结束' : '进行中'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 