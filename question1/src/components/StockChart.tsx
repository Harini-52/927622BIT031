
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://20.244.56.144/evaluation-service";

interface Stock {
  [key: string]: string;
}

interface StockPrice {
  price: number;
  lastUpdatedAt: string;
}

interface StockHistory {
  price: number;
  lastUpdatedAt: string;
}

export const StockChart = () => {
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [timeInterval, setTimeInterval] = useState<number>(30);

  const { data: stocks, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/stocks`);
      if (!response.ok) throw new Error('Failed to fetch stocks');
      const data = await response.json();
      return data.stocks as Stock;
    },
  });

  const { data: stockHistory, isLoading: historyLoading, refetch } = useQuery({
    queryKey: ['stockHistory', selectedStock, timeInterval],
    queryFn: async () => {
      if (!selectedStock) return [];
      const response = await fetch(`${API_BASE}/stocks/${selectedStock}?minutes=${timeInterval}`);
      if (!response.ok) throw new Error('Failed to fetch stock history');
      return await response.json() as StockHistory[];
    },
    enabled: !!selectedStock,
  });

  const { data: currentPrice } = useQuery({
    queryKey: ['currentPrice', selectedStock],
    queryFn: async () => {
      if (!selectedStock) return null;
      const response = await fetch(`${API_BASE}/stocks/${selectedStock}`);
      if (!response.ok) throw new Error('Failed to fetch current price');
      const data = await response.json();
      return data.stock as StockPrice;
    },
    enabled: !!selectedStock,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  useEffect(() => {
    if (stocks && !selectedStock) {
      const firstStock = Object.values(stocks)[0];
      if (firstStock) {
        setSelectedStock(firstStock);
      }
    }
  }, [stocks, selectedStock]);

  const chartData = stockHistory?.map((item, index) => ({
    time: new Date(item.lastUpdatedAt).toLocaleTimeString(),
    price: item.price,
    index,
  })) || [];

  const averagePrice = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.price, 0) / chartData.length 
    : 0;

  const priceChange = chartData.length > 1 
    ? chartData[chartData.length - 1].price - chartData[0].price 
    : 0;

  const priceChangePercent = chartData.length > 1 
    ? ((priceChange / chartData[0].price) * 100) 
    : 0;

  if (stocksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Stock Selection & Time Interval
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select Stock</label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a stock..." />
                </SelectTrigger>
                <SelectContent>
                  {stocks && Object.entries(stocks).map(([company, ticker]) => (
                    <SelectItem key={ticker} value={ticker}>
                      {company} ({ticker})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
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
          </div>
        </CardContent>
      </Card>

      {/* Current Price & Stats */}
      {currentPrice && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="text-2xl font-bold">${currentPrice.price.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className="text-sm text-gray-600">Price Change</p>
                  <p className={`text-2xl font-bold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Average Price</p>
                  <p className="text-2xl font-bold">${averagePrice.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedStock ? `${selectedStock} - Price Chart (Last ${timeInterval} minutes)` : 'Price Chart'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
                {/* Average line */}
                <Line 
                  type="monotone" 
                  dataKey={() => averagePrice} 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for the selected time period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
