# AutoLaunch

AutoLaunch 是一个完全链上、无需许可的资产发售平台，支持用户自助发起认购项目（IDO），具备全自动流程，安全透明，无需人工干预。

## ✨ 特性

- 🛠️ 用户自主发起项目：自由设置价格、时间、筹资目标、最大购买额度等参数。
- ⏳ 自动化时间管理：支持设定「现在起 N 小时后」开始/结束，无需硬编码时间戳。
- 📦 代币认购发放：项目结束后自动发放代币或退款，公平透明。
- 💧 自动添加流动性：成功发射后，自动将一部分筹资金额与代币注入 MinimalDEX 创建交易对。
- 🔐 LP Token 自动锁仓：平台合约会自动锁定 LP Token，避免项目方立即抽走流动性。
- 🚫 筹资失败退款：未达到软顶即自动退款，无需等待项目方操作。
- 🔁 公共 finalize 接口：支持前端 cron/后端调用，也支持链上公开 finalize 调用判断。

## 🧩 技术架构

- 智能合约：基于 Solidity 构建，包括 ERC20、MinimalDEX 与 Launchpad 合约。
- 前端：使用 **Vite + React** 开发的用户界面，支持项目发布、参与、领取、退款等交互。
- 部署网络：支持任意兼容 EVM 的链，例如 Polygon、BSC、Base 等。

## ⚙️ 工作流程

1. **创建项目**
   - 用户调用 `createProject()`，设置代币地址、筹资代币、开始/结束时间（或持续时间）、价格、上限、软/硬顶等参数。
   - 平台合约记录项目参数。

2. **参与认购**
   - 用户在认购期内调用 `buy()`，使用指定的筹资代币进行购买。
   - 合约记录每位用户的购买金额与认购份额，并限制最大购买量。

3. **自动结算**
   - 到达结束时间后，任何人可调用 `finalize()`。
     - 如果达到软顶 → 自动发放代币。
     - 未达到软顶 → 用户可调用 `claimRefund()` 退款。

4. **自动添加 LP & 锁仓**
   - 在 finalize 阶段，部分筹资款和代币注入 MinimalDEX 添加流动性。
   - 收到的 LP Token 会锁仓设定时间，由项目方后续领取。

5. **用户领取**
   - 成功项目：用户调用 `claimTokens()` 领取代币。
   - 失败项目：用户调用 `claimRefund()` 退还筹资款。

## 📁 项目结构

- `contracts/`：Solidity 合约，包括 SimpleERC20、MinimalDEX、Launchpad。
- `frontend/`：Vite + React 编写的前端。
- `scripts/`：部署与测试脚本。
- `docs/`：白皮书、技术说明等。

## 🚀 快速开始

```bash
git clone https://github.com/yourname/autolaunch
cd autolaunch

# 安装前端依赖
cd frontend
npm install
npm run dev
```
