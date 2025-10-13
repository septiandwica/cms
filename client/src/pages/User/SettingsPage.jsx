import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { AuthContext } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";
import { PageContainer } from "../../components/common/PageContainer";
import { ProfileActions } from "../../components/mobile/settings/ProfileAction";
import MobileLayout from "../../components/mobile/MobileLayout"; // ✅ pastikan path benar

const SettingsPage = () => {
  const navigate = useNavigate();
  const { clearUser } = useContext(AuthContext);
  const [loadingLogout, setLoadingLogout] = useState(false);

  // ✅ Gunakan pola yang sama seperti di SideMenu
  const handleLogout = async () => {
    try {
      setLoadingLogout(true);

      localStorage.removeItem("user");
      localStorage.removeItem("token");
      clearUser();

      axiosInstance.post(API_PATHS.AUTH.LOGOUT, {}, { withCredentials: true });

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Unexpected logout error:", err);
    } finally {
      setLoadingLogout(false);
    }
  };
  const handleAction = (action) => {
    switch (action) {
      case "edit":
        navigate("/profile/edit");
        break;
      case "password":
        navigate("/settings/change-password");
        break;
      case "notifications":
        navigate("/settings/notifications");
        break;
      case "logout":
        handleLogout(); // 🔥 gunakan handler baru
        break;
      default:
        break;
    }
  };

  if (loadingLogout) {
    return (
      <MobileLayout>
        <LoadingSpinner text="Logging out..." />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PageContainer>
        <div className="px-4 py-6 space-y-4">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl border border-primary-200 overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                Account Settings
              </h2>
              <p className="text-sm text-gray-500">
                Manage your profile and preferences
              </p>
            </div>

            {/* Profile Actions */}
            <ProfileActions onAction={handleAction} />
          </div>

          {/* Logout Loading Indicator */}
          {loadingLogout && (
            <div className="flex justify-center items-center mt-4 text-primary-600 font-semibold">
              <Loader2 className="animate-spin w-4 h-4 mr-2" /> Logging out...
            </div>
          )}
        </div>
      </PageContainer>
    </MobileLayout>
  );
};

export default SettingsPage;
