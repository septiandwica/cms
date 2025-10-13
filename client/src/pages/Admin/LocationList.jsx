import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import Pagination from "../../components/common/Pagination";
import ActionButtons from "../../components/common/ActionsButton";
import DataTable from "../../components/common/DataTable";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLocations, setTotalLocations] = useState(0);
  const [limit, setLimit] = useState(15);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
  });

  // Fetch locations
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
      };
      const res = await axiosInstance.get(API_PATHS.LOCATIONS.GET_ALL, {
        params,
      });
      const data = res.data;

      setLocations(data.locations);
      setTotalPages(data.totalPages);
      setTotalLocations(data.total);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(API_PATHS.LOCATIONS.CREATE, formData);
      setShowCreateModal(false);
      setFormData({ name: "" });
      fetchLocations();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create location");
    }
  };

  // Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(
        API_PATHS.LOCATIONS.UPDATE(selectedLocation.id),
        formData
      );
      setShowEditModal(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update location");
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(
        API_PATHS.LOCATIONS.DELETE(selectedLocation.id)
      );
      setShowDeleteModal(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete location");
    }
  };

  // Open modals
  const openEditModal = (loc) => {
    setSelectedLocation(loc);
    setFormData({ name: loc.name });
    setShowEditModal(true);
  };

  const openDeleteModal = (loc) => {
    setSelectedLocation(loc);
    setShowDeleteModal(true);
  };

  // Effects
  useEffect(() => {
    fetchLocations();
  }, [currentPage, limit, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (firstLoad && loading) {
      return (
        <DashboardLayout activeMenu="Location">
          <LoadingSpinner text="Loading Location data..." />
        </DashboardLayout>
      );
    }
  return (
    <DashboardLayout activeMenu="Location">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Location Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">Manage locations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Location
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
  data={locations}
  emptyMessage="No locations found"
  columns={[
    {
      label: "Name",
      key: "name",
      render: (loc) => (
        <span className="text-sm font-medium text-gray-900">{loc.name}</span>
      ),
    },
    {
      label: "Created At",
      key: "createdAt",
      render: (loc) =>
        loc.createdAt ? moment(loc.createdAt).format("DD MMM YYYY") : "-",
    },
    {
  label: "Actions",
  key: "actions",
  render: (loc) => (
    <ActionButtons
      onEdit={() => openEditModal(loc)}
      onDelete={() => openDeleteModal(loc)}
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
  totalItems={totalLocations}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Add Location</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Location</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">Delete Location</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium">{selectedLocation?.name}</span>?
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

export default LocationList;
