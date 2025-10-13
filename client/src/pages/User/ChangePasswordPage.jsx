import React, { useState, useContext } from "react";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { AuthContext } from "../../context/AuthContext";
import MobileLayout from "../../components/mobile/MobileLayout";
import { LoadingSpinner } from "../../components/common/LoadingSpinner"; // ✅ pakai spinner elegan

const ChangePasswordPage = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useContext(AuthContext);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // ✅ Basic validation
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    try {
      setLoading(true);

      // ✅ API call sesuai endpoint backend
      const res = await axiosInstance.patch(
        API_PATHS.AUTH.CHANGE_PASSWORD(user.id),
        { oldPassword, newPassword },
        { withCredentials: true }
      );

      setMessage(res.data?.message || "Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Saat loading tampilkan spinner full screen
  if (loading) {
    return (
      <MobileLayout>
        <LoadingSpinner text="Updating password..." />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 py-6 max-w-md mx-auto">
        <form
          onSubmit={handleChangePassword}
          className="bg-white p-6 rounded-3xl shadow-lg border border-primary-200"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Update Your Password
          </h2>

          {/* Old Password */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Old Password
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter your current password"
            className="w-full border border-primary-300 rounded-xl px-4 py-2 mb-3 focus:ring-2 focus:ring-primary-400 outline-none"
          />

          {/* New Password */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            className="w-full border border-primary-300 rounded-xl px-4 py-2 mb-3 focus:ring-2 focus:ring-primary-400 outline-none"
          />

          {/* Confirm Password */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            className="w-full border border-primary-300 rounded-xl px-4 py-2 mb-4 focus:ring-2 focus:ring-primary-400 outline-none"
          />

          {/* Feedback */}
          {error && (
            <p className="text-red-600 text-sm mb-2 text-center">{error}</p>
          )}
          {message && (
            <p className="text-green-600 text-sm mb-2 text-center">{message}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all"
          >
            Change Password
          </button>
        </form>
      </div>
    </MobileLayout>
  );
};

export default ChangePasswordPage;
