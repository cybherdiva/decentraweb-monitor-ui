import { useState } from 'react'
import { ethers } from 'ethers'
import DomainList from './components/DomainList'
import WalletButton from './components/WalletButton'

// Placeholder watched names — replace with your real list or load from localStorage / D1
const INITIAL_NAMES = [
  { name: '.example', network: 'polygon', owner: '', expiresAt: null, graceEndsAt: null, expiryLess: false },
  { name: 'test.example', network: 'polygon', owner: '', expiresAt: null, graceEndsAt: null, expiryLess: false },
]

// Known addresses from Decentraweb docs
const CONTRACTS = {
  ethereum: {
    dweb: '0xE7f58A92476056627f9FdB92286778aBd83b285F',
    rootRegistrar: '0xcCbCa4F9651Ef122D58d7EC5acCa27D806840209',
    chainId: 1,
  },
  polygon: {
    dweb: '0x8839e639F210B80ffea73AedF51baed8DAc04499',
    rootRegistrar: '0x38CcdB2660C63374e475090aAbE4F8339Cf4232E',
    chainId: 137,
  },
}

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]

export default function App() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [address, setAddress] = useState('')
  const [names, setNames] = useState(INITIAL_NAMES)
  const [status, setStatus] = useState('')
  const [network, setNetwork] = useState('polygon')
  const [allowance, setAllowance] = useState(null)
  const [checkingAllowance, setCheckingAllowance] = useState(false)
  const [approving, setApproving] = useState(false)

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus('No wallet found. Install MetaMask or a compatible wallet.')
      return
    }
    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
      await web3Provider.send('eth_requestAccounts', [])
      const web3Signer = web3Provider.getSigner()
      const addr = await web3Signer.getAddress()
      const net = await web3Provider.getNetwork()
      const netName = net.chainId === 1 ? 'ethereum' : net.chainId === 137 ? 'polygon' : 'unknown'
      setProvider(web3Provider)
      setSigner(web3Signer)
      setAddress(addr)
      setNetwork(netName)
      setStatus(`Connected: ${addr.slice(0, 6)}…${addr.slice(-4)} on ${netName}`)
      if (netName !== 'unknown') {
        checkAllowance(web3Provider, addr, netName)
      }
    } catch (err) {
      setStatus(err.message || 'Connection failed')
    }
  }

  const disconnect = () => {
    setProvider(null)
    setSigner(null)
    setAddress('')
    setStatus('')
    setAllowance(null)
  }

  const checkAllowance = async (prov = provider, addr = address, net = network) => {
    if (!prov || !addr || !CONTRACTS[net]) return
    setCheckingAllowance(true)
    try {
      const token = new ethers.Contract(CONTRACTS[net].dweb, ERC20_ABI, prov)
      const raw = await token.allowance(addr, CONTRACTS[net].rootRegistrar)
      const formatted = ethers.utils.formatEther(raw)
      setAllowance({ raw: raw.toString(), formatted, unlimited: raw.gt(ethers.constants.MaxUint256.div(2)) })
    } catch (err) {
      setStatus(`Allowance check failed: ${err.message}`)
      setAllowance(null)
    } finally {
      setCheckingAllowance(false)
    }
  }

  const approveUnlimited = async () => {
    if (!signer || !CONTRACTS[network]) {
      setStatus('Connect a supported wallet first')
      return
    }
    setApproving(true)
    setStatus('Requesting unlimited DWEB approval…')
    try {
      const token = new ethers.Contract(CONTRACTS[network].dweb, ERC20_ABI, signer)
      const tx = await token.approve(CONTRACTS[network].rootRegistrar, ethers.constants.MaxUint256)
      setStatus(`Approval tx sent: ${tx.hash.slice(0, 10)}…`)
      await tx.wait(1)
      setStatus('Unlimited approval confirmed')
      await checkAllowance()
    } catch (err) {
      setStatus(err.message || 'Approval failed')
    } finally {
      setApproving(false)
    }
  }

  const refreshName = async (index) => {
    if (!provider) {
      setStatus('Connect wallet first')
      return
    }
    setStatus(`Refreshing ${names[index].name}…`)
    setTimeout(() => {
      const updated = [...names]
      updated[index] = {
        ...updated[index],
        owner: address || '0x…',
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 45,
        graceEndsAt: Date.now() + 1000 * 60 * 60 * 24 * 135,
      }
      setNames(updated)
      setStatus(`Updated ${names[index].name}`)
    }, 800)
  }

  const allowanceLabel = () => {
    if (checkingAllowance) return 'Checking…'
    if (!allowance) return 'Not checked'
    if (allowance.unlimited) return 'Unlimited (shortcut active)'
    const num = parseFloat(allowance.formatted)
    if (num > 1000) return `${num.toLocaleString()} DWEB (high — shortcut likely active)`
    return `${allowance.formatted} DWEB`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">DecentraWeb Monitor</h1>
        <WalletButton
          address={address}
          onConnect={connectWallet}
          onDisconnect={disconnect}
        />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {status && (
          <div className="mb-6 text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded px-4 py-2">
            {status}
          </div>
        )}

        {address && CONTRACTS[network] && (
          <div className="mb-8 border border-slate-800 rounded-lg p-5 bg-slate-900/40">
            <h2 className="text-lg font-medium mb-1">DWEB Allowance Shortcut</h2>
            <p className="text-sm text-slate-400 mb-4">
              Pre-approve the Root Registrar Controller once. After that the first wallet prompt is skipped on renewals and purchases.
              Approval is limited by the balance in your wallet.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm">
                <span className="text-slate-500">Current allowance: </span>
                <span className={allowance?.unlimited ? 'text-emerald-400' : 'text-slate-200'}>
                  {allowanceLabel()}
                </span>
              </div>
              <button
                onClick={() => checkAllowance()}
                disabled={checkingAllowance}
                className="text-xs px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40"
              >
                {checkingAllowance ? 'Checking…' : 'Refresh Allowance'}
              </button>
              <button
                onClick={approveUnlimited}
                disabled={approving || allowance?.unlimited}
                className="text-sm px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 font-medium disabled:opacity-40"
              >
                {approving ? 'Approving…' : allowance?.unlimited ? 'Already Unlimited' : 'Approve Unlimited DWEB'}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Spender: <span className="font-mono">{CONTRACTS[network].rootRegistrar}</span>
            </p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Watched Names</h2>
          <p className="text-sm text-slate-400">
            Connect your wallet, then refresh a name to read on-chain expiry and owner.
            Replace the placeholder data with real calls to <code className="text-slate-300">@decentraweb/core</code>.
          </p>
        </div>

        <DomainList
          names={names}
          onRefresh={refreshName}
          connected={!!address}
        />
      </main>
    </div>
  )
}
