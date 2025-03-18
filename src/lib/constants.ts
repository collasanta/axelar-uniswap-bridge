// Token definitions
export const TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "ETH",
    logo: "/images/eth.svg",
    decimals: 18,
  },
  USDC: {
    symbol: "USDC",
    name: "USDC",
    logo: "/images/usdc.svg",
    decimals: 6,
  },
  BTC: {
    symbol: "BTC",
    name: "BTC",
    logo: "/images/btc.svg",
    decimals: 8,
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    logo: "/images/bnb.svg",
    decimals: 18,
  },
  ATOM: {
    symbol: "ATOM",
    name: "ATOM",
    logo: "/images/atom.svg",
    decimals: 6,
  },
};

// Chain definitions
export const CHAINS = {
  ethereum: {
    id: 1,
    name: "Ethereum",
    logo: "/images/ethereum-logo.svg",
    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorer: "https://etherscan.io",
  },
  polygon: {
    id: 137,
    name: "Polygon",
    logo: "/images/polygon-logo.svg",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
  },
  // avalanche: {
  //   id: 43114,
  //   name: "Avalanche",
  //   logo: "/images/avalanche-logo.svg",
  //   rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  //   blockExplorer: "https://snowtrace.io",
  // },
  // fantom: {
  //   id: 250,
  //   name: "Fantom",
  //   logo: "/images/fantom-logo.svg",
  //   rpcUrl: "https://rpc.ftm.tools",
  //   blockExplorer: "https://ftmscan.com",
  // },
  // binance: {
  //   id: 56,
  //   name: "BNB Chain",
  //   logo: "/images/binance-logo.svg",
  //   rpcUrl: "https://bsc-dataseed.binance.org",
  //   blockExplorer: "https://bscscan.com",
  // },
  // arbitrum: {
  //   id: 42161,
  //   name: "Arbitrum",
  //   logo: "/images/arbitrum-logo.svg",
  //   rpcUrl: "https://arb1.arbitrum.io/rpc",
  //   blockExplorer: "https://arbiscan.io",
  // },
  // optimism: {
  //   id: 10,
  //   name: "Optimism",
  //   logo: "/images/optimism-logo.svg",
  //   rpcUrl: "https://mainnet.optimism.io",
  //   blockExplorer: "https://optimistic.etherscan.io",
  // },
  // base: {
  //   id: 8453,
  //   name: "Base",
  //   logo: "/images/base-logo.svg",
  //   rpcUrl: "https://mainnet.base.org",
  //   blockExplorer: "https://basescan.org",
  // },
};

// Uniswap V3 Pool addresses
export const POOL_ADDRESSES = {
  // ETH-USDC 0.3% fee tier pool on Ethereum
  "ethereum-eth-usdc": "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
  // ETH-USDC 0.3% fee tier pool on Polygon
  "polygon-eth-usdc": "0x45dda9cb7c25131df268515131f647d726f50608",
};

// Axelar supported chains for bridging
export const AXELAR_SUPPORTED_CHAINS = ["ethereum", "polygon", "avalanche", "fantom", "binance", "arbitrum", "optimism"];

// Axelar supported tokens for bridging
export const AXELAR_SUPPORTED_TOKENS = ["USDC", "USDT", "DAI", "WETH", "WBTC", "AXL"];

// Transaction status mapping
export const TRANSACTION_STATUS = {
  pending: "Pending",
  executed: "Executed",
  failed: "Failed",
};

// Blockchain finality times for Axelar bridging (in minutes) as in
// https://docs.axelar.dev/learn/txduration/#understanding-interchain-transaction-time
export const BLOCKCHAIN_FINALITY_TIMES = {
  ethereum: 16, // 16 minutes, 200 blocks
  avalanche: 0.05, // 3 seconds, 1 block
  polygon: 4.7, // 4:42 minutes, 128 blocks
  binance: 0.77, // 46 seconds, 15 blocks
  fantom: 0.05, // 3 seconds, 1 block
  kava: 0.75, // 45 seconds, 1 block
  cometbft: 0.02, // Instant (approximated as 1 second)
  optimism: 30, // 30 minutes, 1000000 blocks
  linea: 81, // 81 minutes, 400 blocks
  filecoin: 52, // 52 minutes, 100 blocks
  moonbeam: 0.42, // 25 seconds, 1 block
  celo: 0.2, // 12 seconds, 1 block
  arbitrum: 19.1, // 19:06 minutes, 1000000 blocks
  base: 24, // 24 minutes, 1000000 blocks
};
