import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] =useState(true);
  const [error, setError] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  // filters
  const [searchQuery, setSearchQuery] = useState("");
  
  const [orderStats, setOrderStats] = useState(null);
const [loadingStats, setLoadingStats] = useState(false);

  // modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);

  // selected
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [newStatus, setNewStatus] = useState("");

  /** Fetch Orders */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
      };
      const res = await axiosInstance.get(API_PATHS.ORDERS.GET_ALL, { params });
      const data = res.data;

      setOrders(data.orders);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  /** Fetch Order Details */
  const fetchOrderDetail = async (orderId) => {
    try {
      setLoadingDetail(true);
      const res = await axiosInstance.get(API_PATHS.ORDERS.GET_BY_ID(orderId));
      setOrderDetails(res.data.order);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch order details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchOrderStats = async () => {
  try {
    setLoadingStats(true);
    const res = await axiosInstance.get(API_PATHS.ORDERS.COUNT_STATS);
    setOrderStats(res.data);
  } catch (err) {
    setError(err?.response?.data?.message || "Failed to fetch order stats");
  } finally {
    setLoadingStats(false);
  }
};

const handleCreateBackup = async () => {
  try {
    if (
      !window.confirm(
        "Are you sure you want to create backup orders for users who haven't ordered yet?"
      )
    )
      return;

    const res = await axiosInstance.post(API_PATHS.ORDERS.BACKUP);
    alert(res.data.message);
    fetchOrderStats(); // refresh stats
    fetchOrders(); // refresh orders
  } catch (err) {
    setError(err?.response?.data?.message || "Failed to create backup orders");
  }
};
  /** Delete Order */
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(API_PATHS.ORDERS.DELETE(selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchOrders();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete order");
    }
  };

  /** Approve Single Order */
  const handleApprove = async () => {
    try {
      await axiosInstance.patch(API_PATHS.ORDERS.APPROVE(selectedItem.id));
      setShowApproveModal(false);
      setSelectedItem(null);
      fetchOrders();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to approve order");
    }
  };

  /** Bulk Approve Orders */
  const handleBulkApprove = async () => {
    try {
      await axiosInstance.post(API_PATHS.ORDERS.BULK_APPROVE, {
        order_ids: selectedOrders,
      });
      setSelectedOrders([]);
      fetchOrders();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to bulk approve orders");
    }
  };

  /** Update Order Status */
  const handleUpdateStatus = async () => {
    try {
      await axiosInstance.patch(API_PATHS.ORDERS.UPDATE(selectedItem.id), {
        status: newStatus,
      });
      setShowUpdateStatusModal(false);
      setSelectedItem(null);
      setNewStatus("");
      fetchOrders();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update order status");
    }
  };

  /** Open Modals */
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const openApproveModal = (item) => {
    setSelectedItem(item);
    setShowApproveModal(true);
  };

  const openUpdateStatusModal = (item) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setShowUpdateStatusModal(true);
  };

  const openDetailModal = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    fetchOrderDetail(item.id);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
    setOrderDetails(null);
  };

  /** Toggle checkbox */
  const toggleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  /** Get status badge color */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /** Format day name */
  const getDayName = (date) => {
    return moment(date).format("dddd, DD MMM YYYY");
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

    if (firstLoad && loading) {
      return (
        <DashboardLayout activeMenu="Order">
          <LoadingSpinner message="Loading Order data..." />
        </DashboardLayout>
      );
    }
  return (
    <DashboardLayout activeMenu="Order">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              Order Management
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage user orders • Total: {totalItems}
            </p>
          </div>
          
          {selectedOrders.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Approve Selected ({selectedOrders.length})</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
  {loadingStats ? (
    <p className="text-gray-500 text-sm">Loading stats...</p>
  ) : orderStats ? (
    <>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          Weekly Order Summary ({orderStats.week})
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Total Employees:{" "}
          <span className="font-medium">{orderStats.totalEmployees}</span> •
          Ordered:{" "}
          <span className="text-green-600 font-medium">
            {orderStats.totalOrdered}
          </span>{" "}
          • Not Ordered:{" "}
          <span className="text-red-600 font-medium">
            {orderStats.totalNotOrdered}
          </span>
        </p>
      </div>

      <button
        onClick={handleCreateBackup}
        className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Backup Orders
      </button>
    </>
  ) : (
    <p className="text-gray-500 text-sm">No stats available.</p>
  )}
</div>
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by status (pending, approved, rejected)..."
              className="px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        orders.length > 0 &&
                        selectedOrders.length === orders.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span>Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center">
                      <div className="text-gray-400">
                        <svg
                          className="mx-auto h-12 w-12 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-gray-500">No orders found</p>
                        {searchQuery && (
                          <p className="text-sm text-gray-400 mt-1">
                            Try adjusting your search query
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(o.id)}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        #{o.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {moment(o.order_date).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-xs">
                              {o.user?.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-gray-900 font-medium">
                              {o.user?.name || "-"}
                            </p>
                            {o.user?.email && (
                              <p className="text-gray-500 text-xs">
                                {o.user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="font-medium">
                          {o.order_details?.length || 0}
                        </span>
                        <span className="text-gray-400"> items</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {moment(o.createdAt).format("DD MMM YYYY")}
                        <br />
                        <span className="text-xs text-gray-400">
                          {moment(o.createdAt).format("HH:mm")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openDetailModal(o)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            View
                          </button>
                          {o.status === "pending" && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => openApproveModal(o)}
                                className="text-green-600 hover:text-green-900 text-sm font-medium"
                              >
                                Approve
                              </button>
                            </>
                          )}
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => openUpdateStatusModal(o)}
                            className="text-yellow-600 hover:text-yellow-900 text-sm font-medium"
                          >
                            Update
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => openDeleteModal(o)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
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
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * limit, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> orders
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center px-3">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Order Details
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Order #{selectedItem?.id}
                  </p>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-500">
                      Loading details...
                    </span>
                  </div>
                ) : orderDetails ? (
                  <>
                    {/* Order Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Order Date
                        </p>
                        <p className="font-medium">
                          {moment(orderDetails.order_date).format(
                            "DD MMMM YYYY"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Status
                        </p>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(
                            orderDetails.status
                          )}`}
                        >
                          {orderDetails.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">User</p>
                        <p className="font-medium">
                          {orderDetails.user?.name || "-"}
                        </p>
                        {orderDetails.user?.email && (
                          <p className="text-sm text-gray-500">
                            {orderDetails.user.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Created
                        </p>
                        <p className="font-medium">
                          {moment(orderDetails.createdAt).format(
                            "DD MMM YYYY HH:mm"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Meal Schedule (Next Week)
                      </h4>
                      <div className="space-y-3">
                        {orderDetails.order_details?.length > 0 ? (
                          orderDetails.order_details.map((detail, idx) => (
                            <div
                              key={idx}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {getDayName(detail.day)}
                                  </p>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">
                                        Shift:
                                      </span>{" "}
                                      {detail.shift_id || "-"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Menu:</span>{" "}
                                      {detail.meal_menu?.name ||
                                        detail.meal_menu_id ||
                                        "-"}
                                    </p>
                                  </div>
                                </div>
                                <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                                  Day {idx + 1}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No meal details available
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No details available
                  </p>
                )}
              </div>

              <div className="border-t p-6">
                <button
                  onClick={closeDetailModal}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Order
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete order{" "}
                  <span className="font-medium text-gray-900">
                    #{selectedItem?.id}
                  </span>
                  ?
                  <br />
                  <span className="text-red-600">
                    This action cannot be undone.
                  </span>
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Approve Order
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to approve order{" "}
                  <span className="font-medium text-gray-900">
                    #{selectedItem?.id}
                  </span>
                  ?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Update Order Status
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Update status for order{" "}
                  <span className="font-medium text-gray-900">
                    #{selectedItem?.id}
                  </span>
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUpdateStatusModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrderList;
