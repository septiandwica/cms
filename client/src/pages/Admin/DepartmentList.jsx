import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import DataTable from "../../components/common/DataTable";
import ActionButtons from "../../components/common/ActionsButton";
import Pagination from "../../components/common/Pagination";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [limit, setLimit] = useState(15);

  // Search + filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Form data
  const [formData, setFormData] = useState({ name: "", location_id: "" });

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
        ...(filterLocation && { location_id: filterLocation }),
      };
      const res = await axiosInstance.get(API_PATHS.DEPARTMENTS.GET_ALL, {
        params,
      });
      const data = res.data;

      setDepartments(data.departments);
      setTotalPages(data.totalPages);
      setTotalDepartments(data.total);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations (for filter & form select)
  const fetchLocations = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.LOCATIONS.GET_ALL, {
        params: { limit: 1000 },
      });
      setLocations(res.data.locations || []);
    } catch (err) {
      console.error("Failed to fetch locations", err);
    }
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(API_PATHS.DEPARTMENTS.CREATE, formData);
      setShowCreateModal(false);
      setFormData({ name: "", location_id: "" });
      fetchDepartments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create department");
    }
  };

  // Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(
        API_PATHS.DEPARTMENTS.UPDATE(selectedDepartment.id),
        formData
      );
      setShowEditModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update department");
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(
        API_PATHS.DEPARTMENTS.DELETE(selectedDepartment.id)
      );
      setShowDeleteModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete department");
    }
  };

  // Open modals
  const openEditModal = (dept) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name || "",
      location_id: dept.location?.id || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (dept) => {
    setSelectedDepartment(dept);
    setShowDeleteModal(true);
  };

  // Effects
  useEffect(() => {
    fetchDepartments();
  }, [currentPage, searchQuery, limit, filterLocation]);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filterLocation]);

  if (firstLoad && loading) {
    return (
      <DashboardLayout activeMenu="Department">
        <LoadingSpinner message="Loading Department data..." />
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout activeMenu="Department">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Department Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage company departments
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Department
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by department name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
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
              data={departments}
              emptyMessage="No departments found"
              columns={[
                {
                  label: "Name",
                  key: "name",
                  render: (dept) => (
                    <span className="text-sm font-medium text-gray-900">
                      {dept.name}
                    </span>
                  ),
                },
                {
                  label: "Location",
                  key: "location",
                  render: (dept) => (
                    <span className="text-sm text-gray-700">
                      {dept.location?.name || "-"}
                    </span>
                  ),
                },
                {
                  label: "Users",
                  key: "users",
                  render: (dept) => (
                    <span className="text-sm text-gray-700">
                      {dept.users?.length || 0}
                    </span>
                  ),
                },
                {
                  label: "Created At",
                  key: "createdAt",
                  render: (dept) =>
                    dept.createdAt
                      ? moment(dept.createdAt).format("DD MMM YYYY")
                      : "-",
                },
                {
                  label: "Actions",
                  key: "actions",
                  render: (dept) => (
                    <ActionButtons
                      onEdit={() => openEditModal(dept)}
                      onDelete={() => openDeleteModal(dept)}
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
          totalItems={totalDepartments}
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
            title="Add Department"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
            locations={locations}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <ModalForm
            title="Edit Department"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdate}
            locations={locations}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">Delete Department</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium">{selectedDepartment?.name}</span>?
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
  locations,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name */}
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
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <select
            value={formData.location_id}
            onChange={(e) =>
              setFormData({ ...formData, location_id: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
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

export default DepartmentList;
