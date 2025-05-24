import * as React from "react";
import { useEffect, useState } from "react";

interface StockPriceProps {
  ticker: string;
}

const StockPrice: React.FC<StockPriceProps> = ({ ticker }) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://20.244.56.144/evaluation-service/stocks/${ticker}`)
      .then((res) => res.json())
      .then((data) => {
        setPrice(data.stock.price);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch stock price");
        setLoading(false);
      });
  }, [ticker]);

  if (loading) return <div>Loading price for {ticker}...</div>;
  if (error) return <div>{error}</div>;
  if (price === null) return <div>No price found for {ticker}.</div>;

  return (
    <div>
      <h2>Current Price for {ticker}</h2>
      <p>${price.toFixed(2)}</p>
    </div>
  );
};

export default StockPrice; 