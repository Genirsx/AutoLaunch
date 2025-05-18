import React, { useState } from 'react';
import './App.css';
import { CreateProject } from './components/CreateProject';
import { ViewProjects } from './components/ViewProjects';
import { SubscribeProject } from './components/SubscribeProject';
import { FinalizeProject } from './components/FinalizeProject';
import { ClaimTokens } from './components/ClaimTokens';

type Feature = 'create' | 'view' | 'subscribe' | 'finalize' | 'claim' | null;

function App() {
  const [address, setAddress] = useState<string>('');
  const [activeFeature, setActiveFeature] = useState<Feature>(null);

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAddress(accounts[0]);
      } catch (error) {
        console.error('连接钱包失败:', error);
      }
    } else {
      alert('请安装 MetaMask!');
    }
  };

  const handleFeatureClick = (feature: Feature) => {
    setActiveFeature(activeFeature === feature ? null : feature);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Launchpad DApp</h1>
      </header>
      <main>
        <div className="wallet-section">
          <h2>连接钱包</h2>
          <button onClick={connectWallet}>
            {address ? `已连接: ${address.slice(0, 6)}...${address.slice(-4)}` : '连接 MetaMask'}
          </button>
        </div>

        {address && (
          <div className="features-section">
            <h2>功能列表</h2>
            <div className="feature-grid">
              <div className="feature-card">
                <h3>创建项目</h3>
                <p>部署新的项目代币并创建项目</p>
                <button
                  onClick={() => handleFeatureClick('create')}
                  className={activeFeature === 'create' ? 'active' : ''}
                >
                  {activeFeature === 'create' ? '隐藏' : '创建'}
                </button>
              </div>
              <div className="feature-card">
                <h3>查看项目</h3>
                <p>查看所有项目列表和详情</p>
                <button
                  onClick={() => handleFeatureClick('view')}
                  className={activeFeature === 'view' ? 'active' : ''}
                >
                  {activeFeature === 'view' ? '隐藏' : '查看'}
                </button>
              </div>
              <div className="feature-card">
                <h3>认购项目</h3>
                <p>使用资金代币认购项目</p>
                <button
                  onClick={() => handleFeatureClick('subscribe')}
                  className={activeFeature === 'subscribe' ? 'active' : ''}
                >
                  {activeFeature === 'subscribe' ? '隐藏' : '认购'}
                </button>
              </div>
              <div className="feature-card">
                <h3>结束项目</h3>
                <p>结束项目并结算</p>
                <button
                  onClick={() => handleFeatureClick('finalize')}
                  className={activeFeature === 'finalize' ? 'active' : ''}
                >
                  {activeFeature === 'finalize' ? '隐藏' : '结束'}
                </button>
              </div>
              <div className="feature-card">
                <h3>领取代币</h3>
                <p>领取项目代币或退款</p>
                <button
                  onClick={() => handleFeatureClick('claim')}
                  className={activeFeature === 'claim' ? 'active' : ''}
                >
                  {activeFeature === 'claim' ? '隐藏' : '领取'}
                </button>
              </div>
            </div>
          </div>
        )}

        {address && activeFeature === 'create' && (
          <CreateProject />
        )}
        {address && activeFeature === 'view' && (
          <ViewProjects />
        )}
        {address && activeFeature === 'subscribe' && (
          <SubscribeProject />
        )}
        {address && activeFeature === 'finalize' && (
          <FinalizeProject />
        )}
        {address && activeFeature === 'claim' && (
          <ClaimTokens />
        )}
      </main>
    </div>
  );
}

export default App;
