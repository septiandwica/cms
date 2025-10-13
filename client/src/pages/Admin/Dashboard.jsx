import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const Dashboard = () => {
  useUserAuth();
  const { user } = useContext(AuthContext);

  const [currentTime, setCurrentTime] = useState(moment());

  // State untuk statistik
  const [stats, setStats] = useState({
    users: 0,
    roles: 0,
    locations: 0,
    departments: 0,
    shifts: 0,
    vendorCaterings: 0,
    mealMenus: 0,
    qrCodes: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      // Misalnya backend punya satu endpoint “/stats” yang mengembalikan object:
      // { users, roles, locations, departments, shifts, vendorCaterings, mealMenus, qrCodes }
      const res = await axiosInstance.get("/stats");  // atau punya path khusus
      const data = res.data;
      setStats({
        users: data.users || 0,
        roles: data.roles || 0,
        locations: data.locations || 0,
        departments: data.departments || 0,
        shifts: data.shifts || 0,
        vendorCaterings: data.vendorCaterings || 0,
        mealMenus: data.mealMenus || 0,
        qrCodes: data.qrCodes || 0,
      });
      setErrorStats("");
    } catch (err) {
      console.error("Error fetching stats:", err);
      setErrorStats("Failed to load dashboard stats");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Jika masih loading dan stats belum muncul
  if (loadingStats) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <LoadingSpinner message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="font-poppins">
        {/* Header */}
        <h2 className="text-black font-semibold text-xl">
          Hello, {user?.name || "Guest"}
        </h2>
        <p className="text-gray-500 text-sm mt-1 mb-6">
          {currentTime.format("dddd, Do MMMM YYYY, HH:mm:ss")}
        </p>

        {errorStats && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {errorStats}
          </div>
        )}

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard name="Users" count={stats.users} desc="Total registered users" />
          <StatCard name="Roles" count={stats.roles} desc="Access roles available" />
          <StatCard name="Locations" count={stats.locations} desc="Company locations" />
          <StatCard name="Departments" count={stats.departments} desc="All departments" />
          <StatCard name="Shifts" count={stats.shifts} desc="Shift schedules" />
          <StatCard name="Vendor Catering" count={stats.vendorCaterings} desc="Catering vendors" />
          <StatCard name="Meal Menus" count={stats.mealMenus} desc="Menus available" />
          <StatCard name="QR Codes" count={stats.qrCodes} desc="Generated QR Codes" />
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ name, count, desc }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition">
    <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
    <p className="text-2xl font-bold text-primary-600 mt-2">{count}</p>
    <p className="text-gray-500 text-sm mt-1">{desc}</p>
  </div>
);

export default Dashboard;
