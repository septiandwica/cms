import React from "react";
import { ShoppingBag, Clock, CheckCircle, Calendar } from "lucide-react";

export const ProfileStats = ({ stats }) => {
  const statItems = [
    {
      icon: ShoppingBag,
      label: "Total Orders",
      value: stats?.totalOrders || 0,
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Clock,
      label: "Pending",
      value: stats?.pendingOrders || 0,
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: stats?.completedOrders || 0,
      color: "from-green-500 to-green-600"
    },
    {
      icon: Calendar,
      label: "This Month",
      value: stats?.thisMonth || 0,
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`bg-gradient-to-br ${item.color} text-white rounded-2xl p-4 shadow-md`}
          >
            <Icon className="w-6 h-6 mb-2 opacity-90" />
            <p className="text-2xl font-bold mb-1">{item.value}</p>
            <p className="text-xs opacity-90">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
};