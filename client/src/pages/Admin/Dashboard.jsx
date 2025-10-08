import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import moment from "moment";

const Dashboard = () => {
  
  useUserAuth();
  const { user } = useContext(AuthContext);
  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Dummy summary untuk tiap modul (bisa diganti fetch API)
  const modules = [
    { name: "Users", count: 24, desc: "Total registered users" },
    { name: "Roles", count: 6, desc: "Access roles available" },
    { name: "Locations", count: 2, desc: "Company locations" },
    { name: "Departments", count: 8, desc: "All departments" },
    { name: "Shifts", count: 4, desc: "Shift schedules" },
    { name: "Vendor Catering", count: 12, desc: "Catering vendors" },
    { name: "Meal Menus", count: 35, desc: "Menus available" },
    { name: "QR Codes", count: 58, desc: "Generated QR Codes" },
  ];

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="font-poppins">
        {/* Header */}
        <h2 className="text-black font-semibold text-xl">
          Hello {user?.name || "Guest"}
        </h2>
        <p className="text-gray-500 text-sm mt-1 mb-6">
          {currentTime.format("dddd, Do MMMM YYYY, HH:mm:ss")}
        </p>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                {m.name}
              </h3>
              <p className="text-2xl font-bold text-primary-600 mt-2">{m.count}</p>
              <p className="text-gray-500 text-sm mt-1">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
