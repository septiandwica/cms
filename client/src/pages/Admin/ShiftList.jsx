import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import DataTable from "../../components/common/DataTable";
import ActionButtons from "../../components/common/ActionsButton";
import Pagination from "../../components/common/Pagination";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const ShiftList = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
      const [firstLoad, setFirstLoad] = useState(true); 
  
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShifts, setTotalShifts] = useState(0);
const [limit, setLimit] = useState(15);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    timeOn: "",
    startAt: "",
    endAt: "",
  });

  // Fetch shifts
  const fetchShifts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
      };
      const res = await axiosInstance.get(API_PATHS.SHIFTS.GET_ALL, { params });
      const data = res.data;

      setShifts(data.shifts);
      setTotalPages(data.totalPages);
      setTotalShifts(data.total);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch shifts");
    } finally {
      setLoading(false);
    }
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(API_PATHS.SHIFTS.CREATE, formData);
      setShowCreateModal(false);
      setFormData({ name: "", timeOn: "", startAt: "", endAt: "" });
      fetchShifts();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create shift");
    }
  };

  // Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(
        API_PATHS.SHIFTS.UPDATE(selectedShift.id),
        formData
      );
      setShowEditModal(false);
      setSelectedShift(null);
      fetchShifts();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update shift");
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(API_PATHS.SHIFTS.DELETE(selectedShift.id));
      setShowDeleteModal(false);
      setSelectedShift(null);
      fetchShifts();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete shift");
    }
  };

  // Open modals
  const openEditModal = (shift) => {
    setSelectedShift(shift);
    setFormData({
      name: shift.name || "",
      timeOn: shift.timeOn || "",
      startAt: shift.startAt || "",
      endAt: shift.endAt || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (shift) => {
    setSelectedShift(shift);
    setShowDeleteModal(true);
  };

  // Effects
  useEffect(() => {
  fetchShifts();
}, [currentPage, limit, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

   if (firstLoad && loading) {
      return (
        <DashboardLayout activeMenu="Shift">
          <LoadingSpinner message="Loading Shift data..." />
        </DashboardLayout>
      );
    }
  return (
    <DashboardLayout activeMenu="Shift">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Shift Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">Manage shifts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Shift
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
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
            <DataTable
  loading={loading}
  data={shifts}
  emptyMessage="No shifts found"
  columns={[
    {
      label: "Name",
      key: "name",
      render: (shift) => (
        <span className="text-sm font-medium text-gray-900">{shift.name}</span>
      ),
    },
    {
      label: "Time On",
      key: "timeOn",
      render: (shift) => (
        <span className="text-sm text-gray-700">{shift.timeOn || "-"}</span>
      ),
    },
    {
      label: "Start At",
      key: "startAt",
      render: (shift) => (
        <span className="text-sm text-gray-700">{shift.startAt || "-"}</span>
      ),
    },
    {
      label: "End At",
      key: "endAt",
      render: (shift) => (
        <span className="text-sm text-gray-700">{shift.endAt || "-"}</span>
      ),
    },
    {
      label: "Created At",
      key: "createdAt",
      render: (shift) =>
        shift.createdAt ? moment(shift.createdAt).format("DD MMM YYYY") : "-",
    },
    {
  label: "Actions",
  key: "actions",
  render: (shift) => (
    <ActionButtons
      onEdit={() => openEditModal(shift)}
      onDelete={() => openDeleteModal(shift)}
    />
  ),
},
  ]}
/>
          </div>
        </div>

        {/* Pagination */}
       <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalShifts}
  limit={limit}
  onPageChange={setCurrentPage}
  onLimitChange={(val) => {
    setLimit(val);
    setCurrentPage(1);
  }}
/>

        {/* ===== Modals ===== */}

        {/* Create Modal */}
        {showCreateModal && (
          <ModalForm
            title="Add Shift"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <ModalForm
            title="Edit Shift"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdate}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">Delete Shift</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium">{selectedShift?.name}</span>?
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

const ModalForm = ({ title, formData, setFormData, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Time On
            </label>
            <input
              type="time"
              value={formData.timeOn}
              onChange={(e) =>
                setFormData({ ...formData, timeOn: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start At
            </label>
            <input
              type="time"
              value={formData.startAt}
              onChange={(e) =>
                setFormData({ ...formData, startAt: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End At
            </label>
            <input
              type="time"
              value={formData.endAt}
              onChange={(e) =>
                setFormData({ ...formData, endAt: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3">
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

export default ShiftList;
