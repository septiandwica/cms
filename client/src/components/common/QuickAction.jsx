import React from "react";
import { UtensilsCrossed } from "lucide-react";

export const QuickActionButton = ({ onClick, label = "Place New Order" }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-2xl font-semibold text-base hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
    >
      <UtensilsCrossed className="w-5 h-5" />
      {label}
    </button>
  );
};
