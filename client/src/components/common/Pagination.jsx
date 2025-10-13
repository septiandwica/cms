import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
}) => {
  // jangan return null — biarkan pagination selalu tampil
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);
  const options = [5, 15, 30, 45, 60, 100];

  const goToPrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const getPageNumbers = () => {
    const range = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3 font-poppins">
      {/* Info + Limit Selector */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          Showing{" "}
          <span className="font-medium">
            {totalItems === 0 ? 0 : startItem}
          </span>
          –
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span> items
        </span>

        <div className="flex items-center gap-1">
          <label htmlFor="limit" className="text-gray-500">
            per page:
          </label>
       <select
  id="limit"
  value={limit}
  onChange={(e) => onLimitChange(Number(e.target.value))}
  className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
>
  {options.map((opt) => (
    <option key={opt} value={opt}>
      {opt}
    </option>
  ))}
</select>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-sm px-2 py-1">
        <button
          onClick={goToPrev}
          disabled={currentPage === 1 || totalPages === 0}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1 || totalPages === 0
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-primary-50 text-primary-600"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {totalPages > 0 ? (
          getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                page === currentPage
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-primary-100"
              }`}
            >
              {page}
            </button>
          ))
        ) : (
          <span className="text-gray-400 text-sm px-3">1</span>
        )}

        <button
          onClick={goToNext}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages || totalPages === 0
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-primary-50 text-primary-600"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
