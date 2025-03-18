import TokenBridge from "@/components/TokenBridge";
import TokenSwap from "@/components/TokenSwap";
import Transactions from "@/components/Transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletButton } from "@/components/WalletButton";

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Cross-Chain Token Swap</h1>
          </div>
          <WalletButton />
        </div>
        <p className="text-neutral-500 text-center sm:text-left">Swap tokens and bridge assets across different blockchains</p>
      </header>

      <div className="max-w-md mx-auto">
        <Tabs defaultValue="swap" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="swap" className="flex-1">
              Swap
            </TabsTrigger>
            <TabsTrigger value="bridge" className="flex-1">
              Bridge
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">
              Transactions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="swap" className="space-y-6">
            <TokenSwap showChainSelection={false} />
          </TabsContent>
          <TabsContent value="bridge" className="space-y-6">
            <TokenBridge />
          </TabsContent>
          <TabsContent value="transactions">
            <Transactions />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="mt-12 text-center text-sm text-neutral-500">
        <p>&#169; 2025 Cross-Chain Swap App. Powered by Axelar Network and Uniswap.</p>
      </footer>
    </div>
  );
}
