import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { QrCode, Loader2, UtensilsCrossed } from "lucide-react";

const UserDashboard = () => {
  useUserAuth();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axiosInstance.get(API_PATHS.QR_CODES.GET_ME, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setQrCode(response.data.qrCode);
        }
      } catch (err) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Failed to fetch QR Code. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchQRCode();
    }
  }, [user, token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border-2 border-blue-500">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-2xl mb-4 shadow-lg">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black">
            My <span className="text-blue-500">QR Code</span>
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Scan this code to access your orders
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center">
            <img
              src={qrCode.qr_code_data}
              alt="User QR Code"
              className="w-56 h-56 object-contain rounded-xl border-2 border-gray-200 shadow-lg"
            />
            <p className="mt-4 text-sm text-gray-500">
              {user?.name || user?.email}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-center">No QR Code available.</p>
        )}

        {/* Order Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/order')}
            className="w-full bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <UtensilsCrossed className="w-5 h-5" />
            Place Weekly Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;