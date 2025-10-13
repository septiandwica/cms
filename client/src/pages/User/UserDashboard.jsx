import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { QuickActionButton } from "../../components/common/QuickAction";
import { PageContainer } from "../../components/common/PageContainer";
import MobileLayout from "../../components/mobile/MobileLayout"; // pastikan path sesuai
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mock stats data - nanti bisa diganti API
  const stats = [
    { value: 12, label: "Orders This Month" },
    { value: 3, label: "Pending Orders" },
  ];

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axiosInstance.get(API_PATHS.QR_CODES.GET_ME);
        if (response.status === 200) {
          setQrCode(response.data.qrCode);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch QR Code.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchQRCode();
  }, [user]);

  if (loading) {
    return (
      <MobileLayout>
        <LoadingSpinner />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PageContainer>
        <div className="px-4 py-6 space-y-6">
          {/* Greeting */}
          <h2 className="text-lg font-semibold text-gray-900">
            Hello, {user?.name?.split(" ")[0] || "User"} 👋
          </h2>
          <p className="text-sm text-gray-600">
            Welcome back! Here’s your current canteen order summary.
          </p>

          {/* Statistik */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow p-4 text-center border border-gray-100"
              >
                <p className="text-xl font-bold text-primary-600">
                  {item.value}
                </p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Action */}
          <QuickActionButton onClick={() => navigate("/order")} />
        </div>
      </PageContainer>
    </MobileLayout>
  );
};

export default UserDashboard;
