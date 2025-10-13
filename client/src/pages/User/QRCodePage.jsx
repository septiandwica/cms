import React, { useContext, useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { PageContainer } from "../../components/common/PageContainer";
import MobileLayout from "../../components/mobile/MobileLayout";
import { LoadingSpinner } from "../../components/common/LoadingSpinner"; // ✅ import spinner baru

const QRCodePage = () => {
  const { token, user } = useContext(AuthContext);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(API_PATHS.QR_CODES.GET_ME, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQrCode(res.data.qrCode);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load QR code.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchQRCode();
  }, [token, user]);

  // ✅ Saat loading tampilkan spinner elegan di tengah
  if (loading) {
    return (
      <MobileLayout>
        <LoadingSpinner text="Fetching your QR Code..." />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PageContainer>
        <div className="px-4 py-6 flex flex-col items-center min-h-[70vh]">
          <div className="bg-white w-full rounded-3xl shadow-xl p-6 border border-primary-200 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your QR Code</h2>
              <QrCode className="w-5 h-5 text-primary-600" />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
                <p className="text-red-700 text-sm font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            {/* QR Code Display */}
            {!error && qrCode && (
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-3xl border-2 border-primary-300 shadow-lg">
                  <img
                    src={qrCode.qr_code_data}
                    alt="User QR Code"
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <p className="mt-4 text-xs text-center text-gray-500 px-4">
                  Show this QR code at the canteen to collect your order
                </p>
              </div>
            )}

            {/* Empty State */}
            {!error && !qrCode && (
              <p className="text-gray-500 text-center py-12">
                No QR Code available yet.
              </p>
            )}
          </div>
        </div>
      </PageContainer>
    </MobileLayout>
  );
};

export default QRCodePage;
