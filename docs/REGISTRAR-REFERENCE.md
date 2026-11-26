# DecentraWeb Self-Registrar Reference

Use this with `@decentraweb/core` + ethers v5 to let people register under your staked TLDs.

## Contract Addresses

### Ethereum Mainnet
| Name | Address |
|------|---------|
| $DWEB Token | `0xE7f58A92476056627f9FdB92286778aBd83b285F` |
| Registry | `0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A` |
| Root Registrar Controller | `0xcCbCa4F9651Ef122D58d7EC5acCa27D806840209` |
| Public Resolver | `0xf157D3559DF1F8c69cb757A1A2cdF8736618E083` |
| Reverse Registrar | `0x3D8f878584199e47a2d40A1E269042E10aa50754` |

### Polygon Mainnet
| Name | Address |
|------|---------|
| $DWEB Token | `0x8839e639F210B80ffea73AedF51baed8DAc04499` |
| Registry | `0x9f3eadf2360Dc4432a003699398169A2c7C10211` |
| Root Registrar Controller | `0x38CcdB2660C63374e475090aAbE4F8339Cf4232E` |
| Public Resolver | `0xEF2a00dc4ecA8174Bcf59dd8e124ba8f99307FF8` |
| Reverse Registrar | `0x662b0b6253e44F56DF387aCabd86A69D1e2A8cA9` |

**Important:** Always interact with the **Root Registrar Controller**. It is the only contract that accepts payment and completes registration.

## One-Time Unlimited Approval (skips first prompt)

```js
import { registrars } from "@decentraweb/core";

const registrar = new registrars.EthereumTLDRegistrar({ // or PolygonTLDRegistrar
  network: 'mainnet', // or 'matic'
  provider,
  signer
});

// Unlimited DWEB approval
await registrar.allowTokenUsage('DWEB');

// Or specific amount
await registrar.setTokenAllowance('DWEB', ethers.utils.parseEther('100'));
```

## Registration Flow (TLD or under your staked TLD)

```js
import { registrars } from "@decentraweb/core";

const registrar = new registrars.PolygonTLDRegistrar({
  network: 'matic',
  provider,
  signer
});

// 1. Request approval (returns commitment data — save this object)
const approved = await registrar.requestApproval([
  { name: 'desiredname', duration: registrars.DURATION.ONE_YEAR }
]);

// 2. Send commitment on-chain
const committed = await registrar.sendCommitment(approved);
await committed.tx.wait(1);

// 3. Wait 60 seconds
await new Promise(r => setTimeout(r, 60000));

// 4. Complete registration
// false = pay in native / WETH; true = pay in DWEB
const tx = await registrar.register(committed, true);
await tx.wait(1);
```

### Ethereum vs Polygon differences
- **Ethereum**: 3 steps (requestApproval → sendCommitment → wait → register). Can pay in ETH or DWEB.
- **Polygon**: 2 steps after requestApproval. Pay in DWEB or WETH (both need allowance).

## Availability Check (read-only)

Use the Registry to see if a name is available before starting the flow:

```js
import { DWEBRegistry } from "@decentraweb/core";

const dweb = new DWEBRegistry({ network: 'matic', provider });
const name = dweb.name('example.yourtld');
const owner = await name.owner(); // returns address or zero address if available
```

## Renewal Notes
- Renewals go through the same Root Registrar Controller.
- A 90-day grace period applies after expiry.
- You can renew up to 5 years at a time in one transaction.
- Locked terms (price / expiry-less) are fixed at the moment of original registration.

## Protocol Fees (paid by the registrant)
- Web3 Domain / Subdomain registration: ~$2 USD
- Web3 Domain / Subdomain renewal: ~$5 USD
- Your staking fees go to your wallet minus these protocol fees.

## Tips for your UI
1. Save the `approved` and `committed` objects so users can resume if a step fails.
2. Show a clear 60-second countdown after the commitment transaction.
3. Check allowance first; if it is already high, skip the approve step in the UI.
4. Always use the Root Registrar Controller address for the chain the TLD lives on.
