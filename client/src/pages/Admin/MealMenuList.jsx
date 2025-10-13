import React, { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { AuthContext } from "../../context/AuthContext";
import moment from "moment";
import DataTable from "../../components/common/DataTable";
import ActionButtons from "../../components/common/ActionsButton";
import Pagination from "../../components/common/Pagination";
import FilterBar from "../../components/common/FilterBar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const MealMenuList = () => {
  const [mealMenus, setMealMenus] = useState([]);
  const [mealTrays, setMealTrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const userRole = user?.role?.name?.toLowerCase();

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(15);

  // filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    vendor_catering_id: "",
    meal_tray_id: "",
    name: "",
    descriptions: "",
    nutrition_facts: "",
    for_date: "",
    status: "pending",
    status_notes: "",
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

  /** Fetch Meal Menus */
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

  /** Helper: Get valid menu range (Monday–Friday next weeks) */
  const getAllowedMenuDateRange = () => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Cari Senin minggu depan
    const daysUntilNextMonday = (8 - day) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);

    // Minggu target: Senin–Jumat minggu depan
    const targetMonday = nextMonday;
    const targetFriday = new Date(targetMonday);
    targetFriday.setDate(targetMonday.getDate() + 4);

    return {
      from: targetMonday.toISOString().slice(0, 10),
      to: targetFriday.toISOString().slice(0, 10),
    };
  };

  /** Helper: Check if today allowed to create (Fri–Wed only) */
  const canCreateToday = () => {
    const day = new Date().getDay();
    return day !== 4; // Thursday not allowed
  };

  /** Create */
  /** Create */
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      // === Validasi hari (Jumat–Rabu saja)
      if (!canCreateToday()) {
        setError("You can only create menus from Friday to Wednesday.");
        return;
      }

      // === Validasi tanggal for_date harus dalam minggu target
      const { from, to } = getAllowedMenuDateRange();
      if (formData.for_date < from || formData.for_date > to) {
        setError(
          `Invalid date. You can only select between ${from} and ${to}.`
        );
        return;
      }

      const payload = {
        meal_tray_id: formData.meal_tray_id,
        name: formData.name,
        descriptions: formData.descriptions,
        nutrition_facts: formData.nutrition_facts,
        for_date: formData.for_date,
      };

      if (userRole === "vendor_catering") {
        payload.vendor_catering_id = user.vendor_catering_id || user.id;
      } else {
        payload.vendor_catering_id = formData.vendor_catering_id;
      }

      if (userRole === "admin" || userRole === "general_affair")
        payload.status = formData.status;

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

      // 1️⃣ Vendor hanya bisa edit field tertentu (tanpa status)
      if (userRole === "vendor_catering") {
        Object.assign(payload, {
          meal_tray_id: formData.meal_tray_id,
          name: formData.name,
          descriptions: formData.descriptions,
          nutrition_facts: formData.nutrition_facts,
          for_date: formData.for_date,
        });
      }

      // 2️⃣ General Affair hanya bisa ubah status
      else if (userRole === "general_affair") {
        await axiosInstance.patch(
          API_PATHS.MEAL_MENUS.UPDATE_STATUS(selectedItem.id),
          {
            status: formData.status,
            status_notes: formData.status_notes || "",
          }
        );
        setShowEditModal(false);
        fetchMealMenus();
        return;
      }

      // 3️⃣ Admin bisa semuanya (edit dan status)
      else if (userRole === "admin") {
        Object.assign(payload, formData);
      }

      // 🚀 Kirim PUT jika ada payload (edit isi)
      if (Object.keys(payload).length > 0) {
        await axiosInstance.put(
          API_PATHS.MEAL_MENUS.UPDATE(selectedItem.id),
          payload
        );
      }

      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      fetchMealMenus();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update meal menu");
    }
  };

  // ✅ Admin & GA boleh bulk update status
  // ✅ Vendor tidak boleh
  const handleBulkStatusUpdate = async (status, notes) => {
    try {
      if (userRole === "vendor_catering") {
        alert("You don't have permission to update status.");
        return;
      }

      await axiosInstance.patch(API_PATHS.MEAL_MENUS.BULK_UPDATE_STATUS, {
        ids: selectedIds,
        status,
        status_notes: notes,
      });
      alert("Status updated successfully!");
      setSelectedIds([]);
      setShowBulkModal(false);
      fetchMealMenus();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update status");
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

  // ✅ NEW: Bulk Upload Handler
  const handleBulkUpload = async (file) => {
    try {
      if (!file) return alert("Please select a file first");
      const formData = new FormData();
      formData.append("file", file);

      await axiosInstance.post(API_PATHS.MEAL_MENUS.BULK_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Bulk upload successful!");
      setShowBulkModal(false);
      fetchMealMenus();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to upload file");
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      vendor_catering_id:
        item.vendor_catering_id || item.vendor_catering?.id || "",
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
  }, [currentPage, searchQuery, statusFilter, dateFrom, dateTo, limit]);

  const canViewVendor = ["admin", "general_affair"].includes(userRole);
  const isVendor = userRole === "vendor_catering";

  if (firstLoad && loading) {
    return (
      <DashboardLayout activeMenu="Menu Makanan">
        <LoadingSpinner text="Loading Menu Makanan..." />
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout activeMenu="Menu Makanan">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Meal Menu Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage daily meal menus
            </p>
          </div>
          <div className="flex gap-2">
            {isVendor && (
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Upload Excel/CSV
              </button>
            )}
            {(userRole === "admin" || userRole === "general_affair") && (
              <button
                onClick={() => setShowBulkUpdateModal(true)}
                disabled={selectedIds.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Bulk Update Status
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
            >
              Add Meal Menu
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          placeholder="Search by menu name..."
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <DataTable
              selectable={["admin", "general_affair"].includes(userRole)}
              selectedIds={selectedIds}
              onSelectAll={(checked) =>
                setSelectedIds(checked ? mealMenus.map((m) => m.id) : [])
              }
              onSelectRow={(id, checked) =>
                setSelectedIds((prev) =>
                  checked ? [...prev, id] : prev.filter((x) => x !== id)
                )
              }
              maxHeight="100vh"
              columns={[
                {
                  label: "Date",
                  render: (m) => moment(m.for_date).format("DD MMM YYYY"),
                },
                { key: "name", label: "Menu" },
                { key: "descriptions", label: "Description" },
                { label: "Tray", render: (m) => m.meal_tray?.name || "-" },
                {
                  label: "Vendor",
                  render: (m) => m.vendor_catering?.name || "-",
                },
                {
                  label: "Shift",
                  render: (m) => m.vendor_catering?.shift?.name || "-",
                },
                {
                  label: "Location",
                  render: (m) => m.vendor_catering?.location?.name || "-",
                },
                {
                  label: "Status",
                  render: (m) => (
                    <span
                      className={`px-2 py-1 text-xs rounded-lg ${
                        m.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : m.status === "revisi"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {m.status}
                    </span>
                  ),
                },
                {
                  label: "Actions",
                  render: (m) => (
                    <ActionButtons
                      onEdit={() => openEditModal(m)}
                      onDelete={() => openDeleteModal(m)}
                    />
                  ),
                },
              ]}
              data={mealMenus}
              loading={loading}
              emptyMessage="No meal menus found"
            />
          </div>
        </div>

        {showBulkUploadModal && (
          <BulkUploadModal
            onClose={() => setShowBulkUploadModal(false)}
            onUpload={handleBulkUpload}
          />
        )}

        {showBulkUpdateModal && (
          <BulkUpdateStatusModal
            onClose={() => setShowBulkUpdateModal(false)}
            onUpdate={handleBulkStatusUpdate}
          />
        )}
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={(page) => setCurrentPage(page)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setCurrentPage(1); // reset ke page 1 kalau ubah limit
          }}
        />

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
            user={user}
            isEdit={false}
            getAllowedMenuDateRange={getAllowedMenuDateRange} // ✅ tambahkan ini
            canCreateToday={canCreateToday} // ✅ dan ini
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
            getAllowedMenuDateRange={getAllowedMenuDateRange} // ✅ juga di sini
            canCreateToday={canCreateToday} // ✅ ini juga
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

const ModalForm = ({
  title,
  formData,
  setFormData,
  onClose,
  onSubmit,
  mealTrays,
  userRole,
  isEdit,
  getAllowedMenuDateRange,
  canCreateToday,
  user, // 🔥 pastikan dikirim dari parent
}) => {
  const isVendor = userRole === "vendor_catering";
  const isGeneralAffair = userRole === "general_affair";
  const isAdmin = userRole === "admin";

  const [vendors, setVendors] = useState([]);
  const [availableTrays, setAvailableTrays] = useState([]);

  /** 🔹 Fetch active vendors (untuk Admin / GA) */
  useEffect(() => {
    if (isAdmin || isGeneralAffair) {
      axiosInstance
        .get(API_PATHS.VENDOR_CATERINGS.GET_ALL)
        .then((res) => {
          const allVendors = res.data.vendor_caterings || [];
          const active = allVendors.filter((v) => v.status === "active");
          setVendors(active);
        })
        .catch((err) => console.error("Failed to fetch vendors:", err));
    }
  }, []);

  /** 🔹 Filter trays yang belum dipakai di tanggal & shift vendor */
  useEffect(() => {
    const fetchAvailableTrays = async () => {
      if (!formData.for_date) {
        // Jika tanggal belum dipilih → kosongkan dulu
        setAvailableTrays([]);
        return;
      }

      try {
        const res = await axiosInstance.get(API_PATHS.MEAL_MENUS.GET_ALL, {
          params: {
            date_from: formData.for_date,
            date_to: formData.for_date,
          },
        });

        // Dapatkan shift yang sedang aktif
        const currentShiftId = isVendor
          ? user?.vendor_catering?.shift_id
          : vendors.find((v) => v.id === formData.vendor_catering_id)?.shift_id;

        // Tray yang sudah dipakai di tanggal & shift ini
        const usedTrayIds = new Set(
          res.data.meal_menus
            .filter((m) => m.vendor_catering?.shift_id === currentShiftId)
            .map((m) => m.meal_tray_id)
        );

        // Filter tray yang belum dipakai
        const filtered = mealTrays.filter((t) => !usedTrayIds.has(t.id));
        setAvailableTrays(filtered);
      } catch (err) {
        console.error("Failed to filter trays:", err);
      }
    };

    fetchAvailableTrays();
  }, [formData.for_date, formData.vendor_catering_id, mealTrays]);

  const { from, to } = getAllowedMenuDateRange();
  const isAllowed = canCreateToday();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* ✅ Case 1: GA edit status */}
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
                  <option value="revisi">Revisi</option>
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
                  placeholder="Optional notes"
                />
              </div>
            </>
          ) : (
            <>
              {/* ✅ Step 1: Vendor (optional) */}
              {(isAdmin || isGeneralAffair) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor Catering
                  </label>
                  <select
                    value={formData.vendor_catering_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vendor_catering_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.location?.name || "-"} (
                        {v.shift?.name || "-"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ✅ Step 2: Date first */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  For Date{" "}
                  <span className="text-gray-400 text-xs">
                    (Allowed: {from} → {to})
                  </span>
                </label>
                <input
                  type="date"
                  min={from}
                  max={to}
                  value={formData.for_date}
                  onChange={(e) =>
                    setFormData({ ...formData, for_date: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    !isAllowed ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  required
                  disabled={!isAllowed || isGeneralAffair}
                />
                {!isAllowed && (
                  <p className="text-xs text-red-600 mt-1">
                    You can only create menus from Friday to Wednesday.
                  </p>
                )}
              </div>

              {/* ✅ Step 3: Tray muncul SETELAH tanggal dipilih */}
              {formData.for_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Meal Tray
                  </label>
                  <select
                    value={formData.meal_tray_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        meal_tray_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    disabled={isGeneralAffair}
                  >
                    <option value="">Select Meal Tray</option>
                    {availableTrays.map((tray) => (
                      <option key={tray.id} value={tray.id}>
                        {tray.name}
                      </option>
                    ))}
                  </select>

                  {availableTrays.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      No trays available for this date and shift.
                    </p>
                  )}
                </div>
              )}

              {/* ✅ Step 4: Menu details */}
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

              {/* ✅ Step 5: Status (optional for Admin) */}
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
                    <option value="revisi">Revisi</option>
                  </select>
                </div>
              )}
            </>
          )}

          {/* ✅ Buttons */}
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


const BulkUpdateStatusModal = ({ onClose, onUpdate }) => {
  const [newStatus, setNewStatus] = useState("approved");
  const [statusNotes, setStatusNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Bulk Update Status</h3>
        <p className="text-sm text-gray-500 mb-4">
          Update status for selected meal menus.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="approved">Approved</option>
              <option value="revisi">Revisi</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="Reason or additional note"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => onUpdate(newStatus, statusNotes)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

const BulkUploadModal = ({ onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Bulk Upload Meal Menus</h3>
        <p className="text-sm text-gray-500 mb-3">
          Upload file in <strong>.xlsx</strong> or <strong>.csv</strong> format.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-4 border p-2 rounded-lg"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => onUpload(file)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealMenuList;
