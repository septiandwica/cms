// src/components/common/StatusModal.jsx
import React from "react";
import { AlertTriangle, Ban, Info } from "lucide-react";

const StatusModal = ({ type, message, onClose }) => {
  const icons = {
    inactive: <Ban className="w-16 h-16 text-red-600" />,
    suspend: <AlertTriangle className="w-16 h-16 text-yellow-500" />,
    info: <Info className="w-16 h-16 text-blue-500" />,
  };

  const titles = {
    inactive: "Access Denied",
    suspend: "Account Suspended",
    info: "Notice",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-scaleIn">
        {/* Icon Centered */}
        <div className="flex justify-center mb-4">
          {icons[type] || icons.info}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          {titles[type] || "Notification"}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{message}</p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg shadow-md transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StatusModal;
