import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import Select from "react-select";

const VendorCateringList = () => {
  const [vendorCaterings, setVendorCaterings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVendorCaterings, setTotalVendorCaterings] = useState(0);
  const [limit] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedShift, setSelectedShift] = useState("");

  // Filter options
  const [locations, setLocations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const statusOptions = ["active", "inactive"];

  // Modal states
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVC, setSelectedVC] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    location_id: "",
    shift_id: "",
    address: "",
    status: "active",
  });

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.USERS.GET_ALL);
      setUsers(res.data.users || res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };
  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.name,
  }));
  // Fetch options
  const fetchLocations = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.LOCATIONS.GET_ALL);
      setLocations(res.data.locations || res.data);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.SHIFTS.GET_ALL);
      setShifts(res.data.shifts || res.data);
    } catch (err) {
      console.error("Error fetching shifts:", err);
    }
  };

  // Fetch vendor caterings
  const fetchVendorCaterings = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedLocation && { location_id: selectedLocation }),
        ...(selectedShift && { shift_id: selectedShift }),
      };

      const res = await axiosInstance.get(API_PATHS.VENDOR_CATERINGS.GET_ALL, {
        params,
      });

      const data = res.data;
      setVendorCaterings(data.vendor_caterings);
      setTotalPages(data.totalPages);
      setTotalVendorCaterings(data.total);
      setError("");
    } catch (err) {
      setError(err || "Failed to fetch vendor caterings");
    } finally {
      setLoading(false);
    }
  };

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(API_PATHS.VENDOR_CATERINGS.CREATE, formData);
      setShowCreateModal(false);
      setFormData({
        user_id: "",
        name: "",
        location_id: "",
        shift_id: "",
        address: "",
        status: "active",
      });
      fetchVendorCaterings();
    } catch (err) {
      setError(err || "Failed to create vendor catering");
    }
  };

  // Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(
        API_PATHS.VENDOR_CATERINGS.UPDATE(selectedVC.id),
        formData
      );
      setShowEditModal(false);
      setSelectedVC(null);
      fetchVendorCaterings();
    } catch (err) {
      setError(err || "Failed to update vendor catering");
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(
        API_PATHS.VENDOR_CATERINGS.DELETE(selectedVC.id)
      );
      setShowDeleteModal(false);
      setSelectedVC(null);
      fetchVendorCaterings();
    } catch (err) {
      setError(err || "Failed to delete vendor catering");
    }
  };

  // Open modals
  const openEditModal = (vc) => {
    setSelectedVC(vc);
    setFormData({
      user_id: vc.user_id,
      name: vc.name,
      location_id: vc.location_id,
      shift_id: vc.shift_id,
      address: vc.address,
      status: vc.status,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (vc) => {
    setSelectedVC(vc);
    setShowDeleteModal(true);
  };

  // Effects
  useEffect(() => {
    fetchLocations();
    fetchShifts();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchVendorCaterings();
  }, [
    currentPage,
    searchQuery,
    selectedStatus,
    selectedLocation,
    selectedShift,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <DashboardLayout activeMenu="Vendor Catering">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Vendor Catering Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage vendor caterings and assignments
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Vendor Catering
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or address..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name & Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location & Shift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created At
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
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : vendorCaterings.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No vendor caterings found
                    </td>
                  </tr>
                ) : (
                  vendorCaterings.map((vc) => (
                    <tr key={vc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vc.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vc.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {vc.user?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {vc.location?.name || "-"} / {vc.shift?.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            vc.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {vc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {moment(vc.createdAt).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(vc)}
                            className="text-primary-600 hover:text-primary-900 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(vc)}
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
        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Add Vendor Catering
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <Select
                    options={userOptions}
                    value={
                      userOptions.find(
                        (opt) => opt.value === formData.user_id
                      ) || null
                    }
                    onChange={(selected) => {
                      const selectedUser = users.find(
                        (u) => u.id === selected?.value
                      );
                      setFormData({
                        ...formData,
                        user_id: selected?.value || "",
                        name: selectedUser?.name || "", // isi otomatis dari user.name
                      });
                    }}
                    isSearchable
                    placeholder="Search user..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name (auto from user)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
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
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Shift
                  </label>
                  <select
                    value={formData.shift_id}
                    onChange={(e) =>
                      setFormData({ ...formData, shift_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Shift</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
              <h3 className="text-lg font-semibold mb-4">
                Edit Vendor Catering
              </h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <Select
                    options={userOptions}
                    value={
                      userOptions.find(
                        (opt) => opt.value === formData.user_id
                      ) || null
                    }
                    onChange={(selected) => {
                      const selectedUser = users.find(
                        (u) => u.id === selected?.value
                      );
                      setFormData({
                        ...formData,
                        user_id: selected?.value || "",
                        name: selectedUser?.name || "", // isi otomatis dari user.name
                      });
                    }}
                    isSearchable
                    placeholder="Search user..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name (auto from user)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
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
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Shift
                  </label>
                  <select
                    value={formData.shift_id}
                    onChange={(e) =>
                      setFormData({ ...formData, shift_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Shift</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
              <h3 className="text-lg font-semibold mb-4">
                Delete Vendor Catering
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium">{selectedVC?.name}</span>?
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, totalVendorCaterings)} of{" "}
              {totalVendorCaterings}
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
      </div>
    </DashboardLayout>
  );
};

export default VendorCateringList;
