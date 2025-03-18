import { useEffect, useState } from "react";

interface CoinGeckoResponse {
  ethereum: {
    usd: number;
  };
}

export const useEthPrice = (ethAmount: number) => {
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
        );
        const data = (await response.json()) as CoinGeckoResponse;
        const ethPrice = data.ethereum.usd;
        setUsdPrice(ethPrice * ethAmount);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to fetch ETH price");
        setIsLoading(false);
      }
    };

    void fetchPrice();
    // Refresh price every minute
    const interval = setInterval(() => void fetchPrice(), 60000);

    return () => clearInterval(interval);
  }, [ethAmount]);

  return { usdPrice, isLoading, error };
};
