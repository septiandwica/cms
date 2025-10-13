import React from "react";
import { Search } from "lucide-react";

/**
 * Reusable Filter Bar
 * --------------------------------------
 * Props:
 * - searchQuery: string
 * - onSearchChange: function
 * - statusFilter: string
 * - onStatusChange: function
 * - dateFrom: string
 * - onDateFromChange: function
 * - dateTo: string
 * - onDateToChange: function
 * - showStatus: boolean (default true)
 * - showDateRange: boolean (default true)
 * - placeholder: string (optional)
 */

const FilterBar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  showStatus = true,
  showDateRange = true,
  placeholder = "Search...",
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center font-poppins">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-3 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-200 focus:outline-none"
        />
      </div>

      {/* Status Filter */}
      {showStatus && (
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-200 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </select>
      )}

      {/* Date From */}
      {showDateRange && (
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="px-3 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-200 focus:outline-none"
          placeholder="Date from"
        />
      )}

      {/* Date To */}
      {showDateRange && (
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="px-3 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-200 focus:outline-none"
          placeholder="Date to"
        />
      )}
    </div>
  );
};

export default FilterBar;
