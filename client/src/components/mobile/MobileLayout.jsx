import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { TopNav } from "../mobile/TopNav";
import { BottomNav } from "../mobile/BottomNav";
import { LoadingSpinner } from "../common/LoadingSpinner";

const MobileLayout = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("home");

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNav userName={user?.name || user?.username || "User"} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">{children}</div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default MobileLayout;
