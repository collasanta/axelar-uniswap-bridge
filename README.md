Live App Link: https://axelar-uniswap-bridge.vercel.app/

# Cross-Chain Token Swap Application

A Uniswap-inspired web application that simulates cross-chain token swaps and bridges by fetching Uniswap liquidity pool data and Axelar bridge fee estimates. This application provides a seamless user experience for swapping tokens on Ethereum and bridging them to other chains like Polygon.

## Features

- **Token Swap**: Simulates swapping tokens (ETH, USDC, etc.) on Ethereum with real-time rate calculations
- **Token Bridge**: Enables bridging USDC from Ethereum to Polygon with accurate fee estimates
- **Bridge Fee Estimates**: Fetches live Axelar bridge fee data for cross-chain transfers
- **Live Transactions**: Displays recent Axelar cross-chain transactions with status updates
- **Responsive UI**: Clean, modern interface that works on all devices
- **Wallet Integration**: Connect MetaMask or other Web3 wallets to simulate transactions
- **Settings Management**: Adjust slippage tolerance and transaction deadlines

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and React 18
- **Styling**: Tailwind CSS with custom gradient components
- **UI Components**: shadcn/ui with Radix UI primitives
- **Data Fetching**: TanStack Query (React Query v5) for efficient data fetching and caching
- **Web3 Integration**: ethers.js for wallet connection and blockchain interactions
- **State Management**: React Context API for global state
- **HTTP Client**: Axios for API requests

## APIs Used

- **Uniswap V3 Subgraph**: For fetching liquidity pool data
- **Axelar Gas Fee API**: For bridge fee estimates
- **AxelarScan API**: For recent cross-chain transactions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or another Web3 wallet extension (optional for full functionality)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/cross-chain-token-swap.git
   cd cross-chain-token-swap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables (optional):
   ```
   NEXT_PUBLIC_AXELAR_API_KEY=your_axelar_api_key
   NEXT_PUBLIC_GRAPH_API_KEY=your_graph_api_key
   NEXT_PUBLIC_UNISWAP_SUBGRAPH_ID=your_uniswap_subgraph_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

- `/src/app`: Next.js app router pages and layouts
- `/src/components`: UI components organized by feature
  - `/ui`: Base UI components from shadcn/ui
  - `TokenSwap.tsx`: Main component for token swapping functionality
  - `TokenBridge.tsx`: Main component for token bridging functionality
  - `SettingsModal.tsx`: Shared settings component for adjusting slippage and deadlines
  - `Transactions.tsx`: Component for displaying transaction history
  - `BridgeFeeEstimate.tsx`: Component for displaying bridge fee estimates
- `/src/context`: React context providers
  - `WalletContext.tsx`: Manages wallet connection and state
- `/src/lib`: Utility functions, API services, and constants
  - `api.ts`: API functions for fetching data
  - `utils.ts`: Helper functions
  - `constants.ts`: Application constants
- `/public`: Static assets including images and icons

## Deployment

This application can be easily deployed on Vercel or Netlify.

## Future Enhancements

- Add support for more tokens and chains
- Implement wallet connection for real transaction simulation
- Add historical data charts for token prices
- Implement transaction history for connected wallets

## Assumptions Made

### Technical Assumptions

- **API Integration**: The application uses a combination of real API calls and mock data. In a production environment, you would need to replace mock data with actual API integrations.

- **Token Support**: Currently, the bridge functionality is locked to USDC only for simplicity and to ensure consistent fee calculations. The swap functionality supports multiple tokens.

- **Chain Support**: The application currently supports Ethereum and Polygon chains. Additional chains would require extending the chain constants and API integrations.

- **Transaction Signing**: Transaction signing is simulated and does not submit actual transactions to the blockchain. In a production environment, you would need to implement proper transaction submission.

- **Gas Fee Estimation**: Gas fees are estimated based on current network conditions but may not reflect exact costs at transaction time.

- **Bridge Time Estimates**: Bridge time estimates are approximated based on typical cross-chain transaction times and may vary in real-world conditions.

### UI/UX Assumptions

- **Modal vs. Inline Settings**: We've implemented settings as a popover rather than inline to save space and provide a cleaner interface.

- **Loading States**: We show skeleton loaders that match the final UI to provide a better user experience during data loading.

- **Error Handling**: Basic error handling is implemented, but a production application would need more comprehensive error handling and user feedback.

- **Responsive Design**: The UI is designed to work on mobile and desktop devices, with optimizations for different screen sizes.


