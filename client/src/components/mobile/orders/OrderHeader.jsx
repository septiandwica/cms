import React from "react";
import { ClipboardList } from "lucide-react";

export const OrdersHeader = ({ title = "Recent Orders", ordersCount }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
          <ClipboardList className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {ordersCount !== undefined && (
            <p className="text-sm text-gray-600">{ordersCount} total orders</p>
          )}
        </div>
      </div>
    </div>
  );
};
