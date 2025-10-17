import React from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, Bell } from "lucide-react";

export const TopNav = ({ userName = "User", unreadCount = 0 }) => {
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    navigate("/dashboard/notifications");
  };

  return (
    <div className="bg-white shadow-md sticky top-0 z-20">
      <div className="flex items-center justify-between p-4">
        {/* Logo & Greeting */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              Canteen Order
            </h1>
            <p className="text-xs text-gray-500">
              Welcome, {userName?.split(" ")[0] || "User"}
            </p>
          </div>
        </div>

        {/* Notification button */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-700" />
          {/* Dot jika ada notifikasi belum dibaca */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>
    </div>
  );
};
