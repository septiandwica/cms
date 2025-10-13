import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import DataTable from "../../components/common/DataTable";
import ActionButtons from "../../components/common/ActionsButton";
import Pagination from "../../components/common/Pagination";

const UserList = () => {
  useUserAuth();
  const { user } = useContext(AuthContext);

  // State utama
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
    const [firstLoad, setFirstLoad] = useState(true); 
  const [error, setError] = useState("");

  // Pagination
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalUsers, setTotalUsers] = useState(0);
const [limit, setLimit] = useState(15);

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Dropdown data
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const statusOptions = ["active", "inactive", "suspended"];

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    role_id: "",
    department_id: "",
    status: "active",
  });

  // Untuk mencegah double submit
  const [submitting, setSubmitting] = useState(false);

  // ====== FETCH MASTER DATA ======
  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ROLES.GET_ALL);
      setRoles(response.data.roles || response.data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.DEPARTMENTS.GET_ALL);
      setDepartments(response.data.departments || response.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  // ====== FETCH USERS ======
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: limit,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedRole && { role_id: selectedRole }),
        ...(selectedDepartment && { department_id: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus }),
      };

      const isAdminDepartment = user?.role?.name === "admin_department";
      const endpoint = isAdminDepartment
        ? API_PATHS.USERS.GET_MANAGED
        : API_PATHS.USERS.GET_ALL;

      const response = await axiosInstance.get(endpoint, { params });
      const data = response.data;

      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
      setFirstLoad(false); 
    }
  };

  // ====== CRUD HANDLERS ======
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.post(
        API_PATHS.USERS.CREATE,
        formData
      );
      if (response.data) {
        setShowCreateModal(false);
        setFormData({
          nik: "",
          name: "",
          email: "",
          password: "",
          phone: "",
          role_id: roles.length ? roles[0].id : "",
          department_id: "",
          status: "active",
        });
        fetchUsers();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updateData = { ...formData };
      delete updateData.password;

      const response = await axiosInstance.put(
        API_PATHS.USERS.UPDATE(selectedUser.id),
        updateData
      );

      if (response.data) {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setSubmitting(true);
    try {
      await axiosInstance.delete(API_PATHS.USERS.DELETE(selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  // ====== MODAL OPENERS ======
  const openEditModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setFormData({
      nik: userToEdit.nik,
      name: userToEdit.name,
      email: userToEdit.email,
      password: "",
      phone: userToEdit.phone || "",
      role_id: userToEdit.role_id || "",
      department_id: userToEdit.department_id || "",
      status: userToEdit.status || "active",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (userToDelete) => {
    setSelectedUser(userToDelete);
    setShowDeleteModal(true);
  };

  // ====== USE EFFECTS ======
  useEffect(() => {
    fetchRoles();
    fetchDepartments();
  }, []);

  // Debounce + fetch users
 useEffect(() => {
  if (!user || !user.role) return;
  fetchUsers();
}, [
  user,
  currentPage,
  limit, // ✅ tambahkan ini
  searchQuery,
  selectedRole,
  selectedDepartment,
  selectedStatus,
]);

  if (firstLoad && loading) {
    return (
      <DashboardLayout activeMenu="User">
        <LoadingSpinner text="Loading user data..." />
      </DashboardLayout>
    );
  }
  // ====== RENDER ======
  return (
    <DashboardLayout activeMenu="User">
      <div className="font-poppins ">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              User Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage system users and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            Add New User
          </button>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
            <p className="text-2xl font-bold text-primary-600 mt-1">
              {totalUsers}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {users.filter((u) => u.status === "active").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600">
              Inactive Users
            </h3>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {users.filter((u) => u.status === "inactive").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600">Current Page</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Show Role & Dept filter only for superadmin */}
            {user?.role?.name !== "admin_department" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
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
  data={users}
  columns={[
    {
      label: "User Info",
      key: "userInfo",
      render: (u) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{u.name}</div>
          <div className="text-sm text-gray-500">{u.email}</div>
          <div className="text-xs text-gray-400">NIK: {u.nik}</div>
        </div>
      ),
    },
    {
      label: "Role & Department",
      key: "roleDept",
      render: (u) => (
        <div>
          <div className="text-sm text-gray-900">
            {u.role?.name || "No Role"}
          </div>
          <div className="text-sm text-gray-500">
            {u.department?.name || "No Department"}
          </div>
        </div>
      ),
    },
    {
      label: "Status",
      key: "status",
      render: (u) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            u.status === "active"
              ? "bg-green-100 text-green-800"
              : u.status === "inactive"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {u.status}
        </span>
      ),
    },
    {
      label: "Created At",
      key: "createdAt",
      render: (u) =>
        u.createdAt ? moment(u.createdAt).format("DD MMM YYYY") : "-",
    },
    {
      label: "Actions",
      key: "actions",
      render: (u) => (
        <ActionButtons
          onEdit={() => openEditModal(u)}
          onDelete={() => openDeleteModal(u)}
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
  totalItems={totalUsers}
  limit={limit}
  onPageChange={setCurrentPage}
  onLimitChange={(val) => {
    setLimit(val);
    setCurrentPage(1);
  }}
/>

        {/* ===== MODALS (Create/Edit/Delete) ===== */}
        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[95%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New User
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIK *
                  </label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nik: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password * (min 8 characters)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                    minLength="8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department{" "}
                    {roles.find((r) => r.id == formData.role_id)?.name !==
                    "vendor_catering"
                      ? "*"
                      : "(optional)"}
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={
                      roles.find((r) => r.id == formData.role_id)?.name ===
                      "vendor_catering"
                    }
                    required={
                      roles.find((r) => r.id == formData.role_id)?.name !==
                      "vendor_catering"
                    }
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[95%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit User
              </h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIK
                  </label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nik: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[95%] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete User
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <strong>{selectedUser?.name}</strong>? This action cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default UserList;
