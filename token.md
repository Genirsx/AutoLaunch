```
合约信息：
MyTokenModule#MyToken - 0x447E18a563225292a3a0622A21335A21FA6cbFc4
Token1Module#Token1 - 0xC7fbAeFF1f1f100d509ce1C321957312c1cc4A77
MiniDexModule#MiniDex - 0xaa197BF3DF2833De88aA1B1ad5010914DA325a7f
LaunchpadModule#Launchpad - 0x96E89Cb38637a8c8D62EE6D98EeC38F1bB851355
```

```
功能集成测试:
  集成测试
    MyToken 测试
MyToken 信息：
名称： MyToken
符号： MTK
总供应量： 1000000.0
当前账户余额： 1000000.0

Token1 信息：
名称： MyToken
符号： MTK
总供应量： 1000000.0
当前账户余额： 1000000.0
      ✔ 基本信息测试 (3828ms)
当前账户是否有 PAUSER_ROLE： true
合约已暂停
合约已恢复
      ✔ 权限功能测试 (45286ms)
    MiniDex 测试

DEX 信息：
Token A 地址： 0xC7fbAeFF1f1f100d509ce1C321957312c1cc4A77
Token B 地址： 0x447E18a563225292a3a0622A21335A21FA6cbFc4
储备 A： 0.0
储备 B： 0.0
当前账户 LP 余额： 0.0
      ✔ DEX 状态查询 (1636ms)

添加流动性前检查授权：
Token A 授权： 115792089237316195423570985008687907853269984665640564039457.584007913129639935
Token B 授权： 0.0

当前余额：
Token A： 1000000.0
Token B： 1000000.0
正在授权 Token B...
Token B 授权完成

正在添加流动性...
Amount A: 100.0
Amount B: 100.0
成功添加流动性

新的储备金额：
储备 A： 100.0
储备 B： 100.0
      ✔ 添加流动性测试 (16001ms)
    Launchpad 测试

Launchpad 信息：
所有者： 0xc47c12A64c1fbA67CCaDBDC74906aF995d7b43EE
DEX 地址： 0xaa197BF3DF2833De88aA1B1ad5010914DA325a7f
资金代币地址： 0x447E18a563225292a3a0622A21335A21FA6cbFc4
项目数量： 0
      ✔ Launchpad 状态查询 (1249ms)

项目列表：
      ✔ 项目信息查询 (300ms)


  6 passing (1m)

```

