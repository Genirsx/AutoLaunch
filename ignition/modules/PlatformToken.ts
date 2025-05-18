import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const PlatformToken = buildModule('PlatformToken', (m) => {
    const token = m.contract('PlatformToken', [], { id: 'PlatformToken' });
    return { token };
});

export default PlatformToken; 