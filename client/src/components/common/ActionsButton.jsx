import React from "react";
import { Edit3, Trash2, Eye } from "lucide-react"; // bisa tambah icon lain juga

const ActionButtons = ({
  onEdit,
  onDelete,
  onView,
  extraButtons = [], // kalau nanti mau tambah custom button
}) => {
  return (
    <div className="flex items-center space-x-2">
      {onView && (
        <button
          onClick={onView}
          title="View"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Eye size={18} className="text-blue-500" />
        </button>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          title="Edit"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Edit3 size={18} className="text-primary-600" />
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          title="Delete"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Trash2 size={18} className="text-red-500" />
        </button>
      )}

      {extraButtons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.onClick}
          title={btn.label}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;
