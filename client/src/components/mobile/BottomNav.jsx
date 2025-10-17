import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ClipboardList, QrCode, User, Settings, Bell } from "lucide-react";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ ambil route saat ini

  const navItems = [
    { id: "home", icon: Home, label: "Home", path: "/dashboard" },
    { id: "orders", icon: ClipboardList, label: "Orders", path: "/order" },
    { id: "qr", icon: QrCode, label: "QR", isCenter: true, path: "/qr-code" },
    { id: "profile", icon: User, label: "Profile", path: "/profile" },
    { id: "settings", icon: Settings, label: "Settings", path: "/settings" },

  ];

  // ✅ Tentukan tab aktif berdasarkan path URL
  const getActiveTab = () => {
    if (location.pathname.startsWith("/dashboard")) return "home";
    if (location.pathname.startsWith("/order")) return "orders";
    if (location.pathname.startsWith("/qr-code")) return "qr";
    if (location.pathname.startsWith("/profile")) return "profile";
    if (location.pathname.startsWith("/settings")) return "settings";
    return "";
  };

  const activeTab = getActiveTab();

  const handleNavClick = (item) => {
    if (item.path) navigate(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-30">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="relative -top-4"
              >
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-full p-4 shadow-lg">
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                isActive ? "text-primary-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-primary-600 rounded-full mt-0.5"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
