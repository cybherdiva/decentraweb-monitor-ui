export default function WalletButton({ address, onConnect, onDisconnect }) {
  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-300 font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={onDisconnect}
          className="text-sm px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onConnect}
      className="text-sm px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 font-medium"
    >
      Connect Wallet
    </button>
  )
}
