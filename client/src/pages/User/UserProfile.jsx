import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../hooks/useUserProfile";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ProfileHeader } from "../../components/mobile/profile/ProfileHeader";
import { ProfileInfoCard } from "../../components/mobile/profile/ProfileInfoCard";
import MobileLayout from "../../components/mobile/MobileLayout"; // pastikan path benar

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, stats, loading } = useUserProfile();
  const [activeTab, setActiveTab] = useState("profile");

  if (loading) {
    return (
      <MobileLayout>
        <LoadingSpinner />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 font-poppins pb-20">
        <div className="px-4 py-6 space-y-4">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-primary-200 overflow-hidden">
            <ProfileHeader user={user} />
          </div>

          {/* Info Card */}
          <ProfileInfoCard user={user} />

          {/* Stats (opsional, kalau mau ditambah dari hook) */}
          {stats && (
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Your Activity
              </h3>
              <ul className="space-y-1 text-xs text-gray-600">
                {Object.entries(stats).map(([key, value]) => (
                  <li key={key}>
                    {key}:{" "}
                    <span className="font-medium text-gray-800">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default UserProfile;
