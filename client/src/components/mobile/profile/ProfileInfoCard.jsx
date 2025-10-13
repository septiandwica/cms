import React from "react";
import { Briefcase, Mail, Phone, Hash, Building2, MapPin } from "lucide-react";

export const ProfileInfoCard = ({ user }) => {
  const infoItems = [
    {
      icon: Hash,
      label: "NIK",
      value: user?.nik
    },
    {
      icon: Mail,
      label: "Email",
      value: user?.email
    },
    {
      icon: Phone,
      label: "Phone",
      value: user?.phone !== "0" ? user?.phone : "Not set"
    },
    {
      icon: Briefcase,
      label: "Role",
      value: user?.role?.name
    },
    {
      icon: Building2,
      label: "Department",
      value: user?.department?.name
    },
    {
      icon: MapPin,
      label: "Location",
      value: user?.department?.location?.name
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-primary-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
      
      <div className="space-y-4">
        {infoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 break-words">
                  {item.value || "-"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};