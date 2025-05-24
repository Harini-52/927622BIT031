
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/StockChart";
import { CorrelationHeatmap } from "@/components/CorrelationHeatmap";
import { Sidebar } from "@/components/Sidebar";
import { TrendingUp, BarChart3 } from "lucide-react";

const Index = () => {
  const [activePage, setActivePage] = useState<"stocks" | "correlation">("stocks");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center gap-3">
            {activePage === "stocks" ? (
              <>
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Stock Price Analytics</h1>
              </>
            ) : (
              <>
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">Correlation Heatmap</h1>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activePage === "stocks" ? (
            <StockChart />
          ) : (
            <CorrelationHeatmap />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
