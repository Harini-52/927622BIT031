
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Menu } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activePage: "stocks" | "correlation";
  onPageChange: (page: "stocks" | "correlation") => void;
}

export const Sidebar = ({ activePage, onPageChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-white border-r shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            <Menu className="w-4 h-4" />
          </Button>
          {!isCollapsed && (
            <h2 className="font-bold text-lg text-gray-900">Stock Analytics</h2>
          )}
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        <Button
          variant={activePage === "stocks" ? "default" : "ghost"}
          className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : ''}`}
          onClick={() => onPageChange("stocks")}
        >
          <TrendingUp className="w-5 h-5" />
          {!isCollapsed && "Stock Prices"}
        </Button>
        
        <Button
          variant={activePage === "correlation" ? "default" : "ghost"}
          className={`w-full justify-start gap-3 ${isCollapsed ? 'px-2' : ''}`}
          onClick={() => onPageChange("correlation")}
        >
          <BarChart3 className="w-5 h-5" />
          {!isCollapsed && "Correlation"}
        </Button>
      </nav>
    </div>
  );
};
