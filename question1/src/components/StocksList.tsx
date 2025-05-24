import * as React from "react";
import { useEffect, useState } from "react";

const StocksList: React.FC = () => {
  const [stocks, setStocks] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://20.244.56.144/evaluation-service/stocks")
      .then((res) => res.json())
      .then((data) => {
        setStocks(data.stocks);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch stocks");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading stocks...</div>;
  if (error) return <div>{error}</div>;
  if (!stocks) return <div>No stocks found.</div>;

  return (
    <div>
      <h2>Available Stocks</h2>
      <ul>
        {Object.entries(stocks).map(([name, ticker]) => (
          <li key={ticker}>
            <strong>{name}</strong>: {ticker}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StocksList; 