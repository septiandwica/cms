import React from "react";
import { User, MapPin } from "lucide-react";

export const ProfileHeader = ({ user }) => {
  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-3xl"></div>
      
      {/* Profile content */}
      <div className="px-6 pb-6">
        <div className="flex flex-col items-center -mt-16">
          {/* Avatar */}
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {getInitials(user?.name)}
              </span>
            </div>
          </div>

          {/* User info */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.name}</h2>
          <p className="text-sm text-gray-600 mb-2">{user?.department?.name}</p>
          
          {/* Location badge */}
          <div className="flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
            <MapPin className="w-3 h-3" />
            <span className="text-xs font-medium">
              {user?.department?.location?.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};