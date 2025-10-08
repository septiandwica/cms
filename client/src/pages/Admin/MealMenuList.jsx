import React, { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { AuthContext } from "../../context/AuthContext";
import moment from "moment";

const MealMenuList = () => {
  const [mealMenus, setMealMenus] = useState([]);
  const [mealTrays, setMealTrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useContext(AuthContext);
  const userRole = user?.role?.name?.toLowerCase();

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  // filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // selected
  const [selectedItem, setSelectedItem] = useState(null);

  // form
  const [formData, setFormData] = useState({
    meal_tray_id: "",
    name: "",
    descriptions: "",
    nutrition_facts: "",
    for_date: "",
    status: "pending",
  });

  /** Fetch Meal Trays */
  const fetchMealTrays = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.MEAL_TRAYS.GET_ALL);
      setMealTrays(res.data.meal_trays || []);
    } catch (err) {
      console.error("Failed to fetch meal trays:", err);
    }
  };

  /** Fetch */
  const fetchMealMenus = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      };
      const res = await axiosInstance.get(API_PATHS.MEAL_MENUS.GET_ALL, {
        params,
      });
      const data = res.data;

      setMealMenus(data.meal_menus);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch meal menus");
    } finally {
      setLoading(false);
    }
  };

  /** Create */
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Vendor catering tidak perlu kirim vendor_catering_id, backend handle otomatis
      const payload = {
        meal_tray_id: formData.meal_tray_id,
        name: formData.name,
        descriptions: formData.descriptions,
        nutrition_facts: formData.nutrition_facts,
        for_date: formData.for_date,
      };

      // Admin atau GA bisa set status
      if (userRole === "admin" || userRole === "general_affair") {
        payload.status = formData.status;
      }

      await axiosInstance.post(API_PATHS.MEAL_MENUS.CREATE, payload);
      setShowCreateModal(false);
      resetForm();
      fetchMealMenus();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create meal menu");
    }
  };

  /** Update */
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {};

      // Vendor catering hanya bisa edit field tertentu
      if (userRole === "vendor_catering") {
        payload.meal_tray_id = formData.meal_tray_id;
        payload.name = formData.name;
        payload.descriptions = formData.descriptions;
        payload.nutrition_facts = formData.nutrition_facts;
        payload.for_date = formData.for_date;
      }
      // General affair hanya bisa edit status
      else if (userRole === "general_affair") {
        payload.status = formData.status;
        if (formData.status_notes) {
          payload.status_notes = formData.status_notes;
        }
      }
      // Admin bisa edit semua
      else if (userRole === "admin") {
        Object.assign(payload, formData);
      }

      await axiosInstance.put(
        API_PATHS.MEAL_MENUS.UPDATE(selectedItem.id),
        payload
      );
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      fetchMealMenus();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update meal menu");
    }
  };

  /** Delete */
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(API_PATHS.MEAL_MENUS.DELETE(selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchMealMenus();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete meal menu");
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      meal_tray_id: item.meal_tray_id || "",
      name: item.name || "",
      descriptions: item.descriptions || "",
      nutrition_facts: item.nutrition_facts || "",
      for_date: item.for_date || "",
      status: item.status || "pending",
      status_notes: item.status_notes || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const resetForm = () =>
    setFormData({
      meal_tray_id: "",
      name: "",
      descriptions: "",
      nutrition_facts: "",
      for_date: "",
      status: "pending",
      status_notes: "",
    });

  useEffect(() => {
    fetchMealMenus();
    fetchMealTrays();
  }, [currentPage, searchQuery, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, dateFrom, dateTo]);

  const canViewVendor = userRole === "admin" || userRole === "general_affair";
  const canEditStatus = userRole === "admin" || userRole === "general_affair";
  const isVendor = userRole === "vendor_catering";

  return (
    <DashboardLayout activeMenu="Meal Menu">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Meal Menu Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage daily meal menus
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Meal Menu
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by menu name..."
            className="px-3 py-2 border rounded-lg w-full"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg w-full"
            placeholder="Date from"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-lg w-full"
            placeholder="Date to"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Menu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tray
                  </th>
                  {canViewVendor && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vendor
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Shift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : mealMenus.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No meal menus found
                    </td>
                  </tr>
                ) : (
                  mealMenus.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {moment(m.for_date).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {m.name}
                      </td>
                       <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {m.descriptions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {m.meal_tray?.name || "-"}
                      </td>
                      {canViewVendor && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {m.vendor_catering?.name || "-"}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {m.vendor_catering?.shift?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {m.vendor_catering?.location?.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-lg ${
                            m.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : m.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(m)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(m)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, totalItems)} of {totalItems}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ===== Modals ===== */}

        {/* Create Modal */}
        {showCreateModal && (
          <ModalForm
            title="Add Meal Menu"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
            mealTrays={mealTrays}
            userRole={userRole}
            isEdit={false}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <ModalForm
            title="Edit Meal Menu"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdate}
            mealTrays={mealTrays}
            userRole={userRole}
            isEdit={true}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">Delete Meal Menu</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium">{selectedItem?.name}</span>?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const ModalForm = ({ title, formData, setFormData, onClose, onSubmit, mealTrays, userRole, isEdit }) => {
  const isVendor = userRole === "vendor_catering";
  const isGeneralAffair = userRole === "general_affair";
  const isAdmin = userRole === "admin";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* General Affair hanya bisa edit status */}
          {isGeneralAffair && isEdit ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status Notes
                </label>
                <textarea
                  value={formData.status_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, status_notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Optional notes about status change"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Meal Tray
                </label>
                <select
                  value={formData.meal_tray_id}
                  onChange={(e) =>
                    setFormData({ ...formData, meal_tray_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={isGeneralAffair}
                >
                  <option value="">Select Meal Tray</option>
                  {mealTrays.map((tray) => (
                    <option key={tray.id} value={tray.id}>
                      {tray.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Menu Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={isGeneralAffair}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  For Date
                </label>
                <input
                  type="date"
                  value={formData.for_date}
                  onChange={(e) =>
                    setFormData({ ...formData, for_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={isGeneralAffair}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descriptions
                </label>
                <textarea
                  value={formData.descriptions}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptions: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  disabled={isGeneralAffair}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nutrition Facts
                </label>
                <textarea
                  value={formData.nutrition_facts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition_facts: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  disabled={isGeneralAffair}
                />
              </div>

              {/* Status hanya untuk Admin atau saat create */}
              {(isAdmin || (!isEdit && !isVendor)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealMenuList;