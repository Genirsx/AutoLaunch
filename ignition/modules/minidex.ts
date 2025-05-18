import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const minidex = buildModule('minidex', (m) => {
    const minidex = m.contract('MultiPairDex', [], { id: 'minidex' });
    return { minidex };
});

export default minidex; 