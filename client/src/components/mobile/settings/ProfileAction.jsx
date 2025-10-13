import React from "react";
import { Edit, Key, Bell, LogOut, ChevronRight } from "lucide-react";

export const ProfileActions = ({ onAction }) => {
  const actions = [
    {
      icon: Edit,
      label: "Edit Profile",
      action: "edit",
      color: "text-primary-600"
    },
    {
      icon: Key,
      label: "Change Password",
      action: "password",
      color: "text-blue-600"
    },
    {
      icon: Bell,
      label: "Notifications",
      action: "notifications",
      color: "text-purple-600"
    },
    {
      icon: LogOut,
      label: "Logout",
      action: "logout",
      color: "text-red-600"
    }
  ];

  
  return (
    <div className="bg-white rounded-2xl shadow-md border border-primary-200 p-4">
      <div className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => {
  onAction(action.action);
}}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${action.color}`} />
                <span className="font-medium text-gray-900">{action.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
};