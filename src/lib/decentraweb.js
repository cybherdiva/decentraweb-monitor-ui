// Drop-in helpers for a self-hosted DecentraWeb registrar
// Requires: @decentraweb/core and ethers@5

import { ethers } from 'ethers';
import { registrars, DWEBRegistry } from '@decentraweb/core';

export const CONTRACTS = {
  ethereum: {
    dweb: '0xE7f58A92476056627f9FdB92286778aBd83b285F',
    rootRegistrar: '0xcCbCa4F9651Ef122D58d7EC5acCa27D806840209',
    registry: '0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A',
  },
  polygon: {
    dweb: '0x8839e639F210B80ffea73AedF51baed8DAc04499',
    rootRegistrar: '0x38CcdB2660C63374e475090aAbE4F8339Cf4232E',
    registry: '0x9f3eadf2360Dc4432a003699398169A2c7C10211',
  },
};

export function getRegistrar(network, provider, signer) {
  const net = network === 'ethereum' || network === 'mainnet' ? 'mainnet' : 'matic';
  const Registrar = net === 'mainnet'
    ? registrars.EthereumTLDRegistrar
    : registrars.PolygonTLDRegistrar;
  return new Registrar({ network: net, provider, signer });
}

export async function checkAllowance(provider, address, network) {
  const c = CONTRACTS[network];
  if (!c) return null;
  const token = new ethers.Contract(
    c.dweb,
    ['function allowance(address,address) view returns (uint256)'],
    provider
  );
  const raw = await token.allowance(address, c.rootRegistrar);
  return {
    raw: raw.toString(),
    formatted: ethers.utils.formatEther(raw),
    unlimited: raw.gt(ethers.constants.MaxUint256.div(2)),
  };
}

export async function approveUnlimited(signer, network) {
  const c = CONTRACTS[network];
  const token = new ethers.Contract(
    c.dweb,
    ['function approve(address,uint256) returns (bool)'],
    signer
  );
  const tx = await token.approve(c.rootRegistrar, ethers.constants.MaxUint256);
  return tx.wait(1);
}

/**
 * Full registration flow for a name under one of your TLDs.
 * Saves intermediate objects so you can resume.
 */
export async function registerName({
  network,
  provider,
  signer,
  name,
  duration = registrars.DURATION.ONE_YEAR,
  payWithDWEB = true,
  onProgress,
}) {
  const registrar = getRegistrar(network, provider, signer);

  onProgress?.('Requesting approval…');
  const approved = await registrar.requestApproval([{ name, duration }]);

  onProgress?.('Sending commitment…');
  const committed = await registrar.sendCommitment(approved);
  await committed.tx.wait(1);

  onProgress?.('Waiting 60 seconds…');
  await new Promise(r => setTimeout(r, 60000));

  onProgress?.('Completing registration…');
  const tx = await registrar.register(committed, payWithDWEB);
  const receipt = await tx.wait(1);

  onProgress?.('Done');
  return { approved, committed, receipt };
}

export async function isAvailable(provider, network, fullName) {
  const net = network === 'ethereum' || network === 'mainnet' ? 'mainnet' : 'matic';
  const dweb = new DWEBRegistry({ network: net, provider });
  try {
    const name = dweb.name(fullName);
    const owner = await name.owner();
    return !owner || owner === ethers.constants.AddressZero;
  } catch {
    return true; // treat errors as available for UX
  }
}
