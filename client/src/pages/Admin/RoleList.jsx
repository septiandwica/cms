import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import DataTable from "../../components/common/DataTable";
import ActionButtons from "../../components/common/ActionsButton";
import Pagination from "../../components/common/Pagination";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);
const [limit, setLimit] = useState(15);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form data
  const [formData, setFormData] = useState({ name: "" });

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
      };
      const res = await axiosInstance.get(API_PATHS.ROLES.GET_ALL, { params });
      const data = res.data;

      setRoles(data.roles);
      setTotalPages(data.totalPages);
      setTotalRoles(data.total);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(API_PATHS.ROLES.CREATE, formData);
      setShowCreateModal(false);
      setFormData({ name: "" });
      fetchRoles();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create role");
    }
  };

  // Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(
        API_PATHS.ROLES.UPDATE(selectedRole.id),
        formData
      );
      setShowEditModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update role");
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(API_PATHS.ROLES.DELETE(selectedRole.id));
      setShowDeleteModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete role");
    }
  };

  // Open modals
  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({ name: role.name || "" });
    setShowEditModal(true);
  };

  const openDeleteModal = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  // Effects
  useEffect(() => {
    fetchRoles();
  }, [currentPage, limit, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (firstLoad && loading) {
      return (
        <DashboardLayout activeMenu="Role">
          <LoadingSpinner text="Loading Role data..." />
        </DashboardLayout>
      );
    }

  return (
    <DashboardLayout activeMenu="Role">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Role Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">Manage system roles</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Role
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
              placeholder="Search by role name..."
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
  data={roles}
  emptyMessage="No roles found"
  columns={[
    {
      label: "Name",
      key: "name",
      render: (r) => (
        <span className="text-sm font-medium text-gray-900">{r.name}</span>
      ),
    },
    {
      label: "Created At",
      key: "createdAt",
      render: (r) =>
        r.createdAt ? moment(r.createdAt).format("DD MMM YYYY") : "-",
    },
    {
  label: "Actions",
  key: "actions",
  render: (r) => (
    <ActionButtons
      onEdit={() => openEditModal(r)}
      onDelete={() => openDeleteModal(r)}
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
  totalItems={totalRoles}
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
            title="Add Role"
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <ModalForm
            title="Edit Role"
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
              <h3 className="text-lg font-semibold mb-4">Delete Role</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium">{selectedRole?.name}</span>?
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

export default RoleList;
