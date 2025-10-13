import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import DataTable from "../../components/common/DataTable";
import ActionButtons from "../../components/common/ActionsButton";
import Pagination from "../../components/common/Pagination";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const MealTrayList = () => {
  const [mealTrays, setMealTrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(15);

  // search filter
  const [searchQuery, setSearchQuery] = useState("");

  // modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // selected item
  const [selectedItem, setSelectedItem] = useState(null);

  // form data
  const [formData, setFormData] = useState({
    name: "",
  });

  /** Fetch list */
  const fetchMealTrays = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
      };
      const res = await axiosInstance.get(API_PATHS.MEAL_TRAYS.GET_ALL, {
        params,
      });
      const data = res.data;

      setMealTrays(data.meal_trays);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch meal trays");
    } finally {
      setLoading(false);
    }
  };

  /** Create */
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(API_PATHS.MEAL_TRAYS.CREATE, formData);
      setShowCreateModal(false);
      resetForm();
      fetchMealTrays();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create meal tray");
    }
  };

  /** Update */
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(
        API_PATHS.MEAL_TRAYS.UPDATE(selectedItem.id),
        formData
      );
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      fetchMealTrays();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update meal tray");
    }
  };

  /** Delete */
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(API_PATHS.MEAL_TRAYS.DELETE(selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchMealTrays();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete meal tray");
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({ name: item.name || "" });
    setShowEditModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const resetForm = () => setFormData({ name: "" });

  useEffect(() => {
    fetchMealTrays();
  }, [currentPage, searchQuery, limit]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (firstLoad && loading) {
      return (
        <DashboardLayout activeMenu="Tray Menu">
          <LoadingSpinner text="Loading Tray Menu..." />
        </DashboardLayout>
      );
    }
  return (
    <DashboardLayout activeMenu="Tray Menu">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Meal Tray Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage list of available meal trays
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Meal Tray
          </button>
        </div>

        {/* Search Filter */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tray name..."
            className="px-3 py-2 border rounded-lg w-full"
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
            <DataTable
          loading={loading}
          data={mealTrays}
          emptyMessage="No meal trays found"
          columns={[
            {
              key: "name",
              label: "Tray Name",
            },
            {
              key: "actions",
              label: "Actions",
              render: (item) => (
                <ActionButtons
                  onEdit={() => openEditModal(item)}
                  onDelete={() => openDeleteModal(item)}
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
            title="Add Meal Tray"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <ModalForm
            title="Edit Meal Tray"
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
              <h3 className="text-lg font-semibold mb-4">Delete Meal Tray</h3>
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

const ModalForm = ({ title, formData, setFormData, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tray Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
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

export default MealTrayList;
