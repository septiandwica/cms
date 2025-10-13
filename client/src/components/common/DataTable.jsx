import React from "react";

const DataTable = ({
  columns,
  data,
  loading,
  emptyMessage = "No data found",
  selectable = false,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  maxHeight = "100vh", // tinggi maksimum tabel (biar scroll vertical juga bisa)
}) => {
  const allSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* wrapper scrollable */}
      <div
        className="overflow-x-auto overflow-y-auto"
        style={{
          maxHeight,
          WebkitOverflowScrolling: "touch",
        }}
      >
        <table className="min-w-[1000px] w-full border-collapse">
          {/* Sticky Header */}
          <thead className="bg-gray-50 sticky top-0 z-20">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-center bg-gray-50 sticky left-0 z-30">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap ${
                    col.className || ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body scrolls independently */}
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {selectable && (
                      <td className="px-6 py-4 text-center sticky left-0 bg-white">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            onSelectRow?.(item.id, e.target.checked)
                          }
                        />
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td
                        key={i}
                        className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
                      >
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
