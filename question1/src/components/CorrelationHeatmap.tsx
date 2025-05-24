
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://20.244.56.144/evaluation-service";

interface Stock {
  [key: string]: string;
}

interface StockHistory {
  price: number;
  lastUpdatedAt: string;
}

interface CorrelationData {
  stock1: string;
  stock2: string;
  correlation: number;
  covariance: number;
  stdDev1: number;
  stdDev2: string;
}

export const CorrelationHeatmap = () => {
  const [timeInterval, setTimeInterval] = useState<number>(30);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: stocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/stocks`);
      if (!response.ok) throw new Error('Failed to fetch stocks');
      const data = await response.json();
      return data.stocks as Stock;
    },
  });

  const calculateCorrelation = (prices1: number[], prices2: number[]): number => {
    const n = Math.min(prices1.length, prices2.length);
    if (n < 2) return 0;

    const mean1 = prices1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = prices2.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = prices1[i] - mean1;
      const diff2 = prices2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const calculateStdDev = (prices: number[]): number => {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  };

  const calculateCovariance = (prices1: number[], prices2: number[]): number => {
    const n = Math.min(prices1.length, prices2.length);
    if (n < 2) return 0;

    const mean1 = prices1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = prices2.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += (prices1[i] - mean1) * (prices2[i] - mean2);
    }

    return sum / (n - 1);
  };

  useEffect(() => {
    const fetchCorrelationData = async () => {
      if (!stocks) return;
      
      setIsCalculating(true);
      const stockTickers = Object.values(stocks);
      const correlations: CorrelationData[] = [];

      try {
        // Fetch price data for all stocks
        const stockDataPromises = stockTickers.map(async (ticker) => {
          const response = await fetch(`${API_BASE}/stocks/${ticker}?minutes=${timeInterval}`);
          if (!response.ok) throw new Error(`Failed to fetch ${ticker}`);
          const data = await response.json() as StockHistory[];
          return { ticker, data };
        });

        const stocksData = await Promise.all(stockDataPromises);

        // Calculate correlations between all pairs
        for (let i = 0; i < stocksData.length; i++) {
          for (let j = i; j < stocksData.length; j++) {
            const stock1 = stocksData[i];
            const stock2 = stocksData[j];
            
            const prices1 = stock1.data.map(d => d.price);
            const prices2 = stock2.data.map(d => d.price);
            
            const correlation = calculateCorrelation(prices1, prices2);
            const covariance = calculateCovariance(prices1, prices2);
            const stdDev1 = calculateStdDev(prices1);
            const stdDev2 = calculateStdDev(prices2);

            correlations.push({
              stock1: stock1.ticker,
              stock2: stock2.ticker,
              correlation,
              covariance,
              stdDev1,
              stdDev2: stdDev2.toString(),
            });
          }
        }

        setCorrelationMatrix(correlations);
        toast.success("Correlation matrix calculated successfully!");
      } catch (error) {
        console.error("Error calculating correlations:", error);
        toast.error("Failed to calculate correlations");
      } finally {
        setIsCalculating(false);
      }
    };

    fetchCorrelationData();
  }, [stocks, timeInterval]);

  const getCorrelationColor = (correlation: number): string => {
    if (correlation > 0.7) return "bg-green-500";
    if (correlation > 0.3) return "bg-green-300";
    if (correlation > -0.3) return "bg-gray-300";
    if (correlation > -0.7) return "bg-red-300";
    return "bg-red-500";
  };

  const getCorrelationStrength = (correlation: number): { text: string; icon: any } => {
    const absCorr = Math.abs(correlation);
    if (absCorr > 0.7) return { text: "Strong", icon: TrendingUp };
    if (absCorr > 0.3) return { text: "Moderate", icon: TrendingUp };
    return { text: "Weak", icon: TrendingDown };
  };

  const stockTickers = stocks ? Object.values(stocks) : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Correlation Analysis Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium mb-2">Time Interval (minutes)</label>
              <Select value={timeInterval.toString()} onValueChange={(value) => setTimeInterval(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Last 10 minutes</SelectItem>
                  <SelectItem value="30">Last 30 minutes</SelectItem>
                  <SelectItem value="60">Last 60 minutes</SelectItem>
                  <SelectItem value="120">Last 2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isCalculating && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Calculating correlations...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Correlation Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stockTickers.length > 0 && correlationMatrix.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="grid gap-1 p-4" style={{ gridTemplateColumns: `100px repeat(${stockTickers.length}, 80px)` }}>
                {/* Header row */}
                <div></div>
                {stockTickers.map((ticker) => (
                  <div key={ticker} className="text-xs font-bold text-center p-2 transform -rotate-45">
                    {ticker}
                  </div>
                ))}
                
                {/* Data rows */}
                {stockTickers.map((ticker1, i) => (
                  <div key={ticker1} className="contents">
                    <div className="text-xs font-bold p-2 flex items-center">
                      {ticker1}
                    </div>
                    {stockTickers.map((ticker2, j) => {
                      const correlationData = correlationMatrix.find(
                        c => (c.stock1 === ticker1 && c.stock2 === ticker2) ||
                             (c.stock1 === ticker2 && c.stock2 === ticker1)
                      );
                      const correlation = correlationData?.correlation || 0;
                      const strength = getCorrelationStrength(correlation);
                      
                      return (
                        <div
                          key={`${ticker1}-${ticker2}`}
                          className={`h-16 w-16 mx-auto flex items-center justify-center text-xs font-bold text-white rounded-md cursor-pointer transition-transform hover:scale-110 ${getCorrelationColor(correlation)}`}
                          title={`${ticker1} vs ${ticker2}: ${correlation.toFixed(3)} (${strength.text})`}
                        >
                          {correlation.toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              {isCalculating ? "Calculating correlation matrix..." : "No data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      {correlationMatrix.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Strong Correlations</p>
                  <p className="text-2xl font-bold">
                    {correlationMatrix.filter(c => Math.abs(c.correlation) > 0.7 && c.stock1 !== c.stock2).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Correlation</p>
                  <p className="text-2xl font-bold">
                    {(correlationMatrix
                      .filter(c => c.stock1 !== c.stock2)
                      .reduce((sum, c) => sum + Math.abs(c.correlation), 0) / 
                      correlationMatrix.filter(c => c.stock1 !== c.stock2).length
                    ).toFixed(3)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Pairs</p>
                  <p className="text-2xl font-bold">
                    {correlationMatrix.filter(c => c.stock1 !== c.stock2).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Correlation Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Strong Positive (0.7 to 1.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span className="text-sm">Moderate Positive (0.3 to 0.7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-sm">Weak (-0.3 to 0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-300 rounded"></div>
              <span className="text-sm">Moderate Negative (-0.7 to -0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Strong Negative (-1.0 to -0.7)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
