import React, { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import moment from "moment";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { AuthContext } from "../../context/AuthContext";
import DataTable from "../../components/common/DataTable";
import ActionButtons from "../../components/common/ActionsButton";
import Pagination from "../../components/common/Pagination";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const userRole = user?.role?.name?.toLowerCase();
  const [userLocationId, setUserLocationId] = useState(null);
  useEffect(() => {
    if (user?.department?.location_id) {
      setUserLocationId(user.department.location_id);
    }
  }, [user]);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(15);

  // filters

  const [orderStats, setOrderStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);

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

  //stats
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loadingWeeklySummary, setLoadingWeeklySummary] = useState(false);

  /** Fetch Orders */
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit,
      };

      // Tentukan endpoint sesuai role
      const endpoint =
        userRole === "vendor_catering"
          ? API_PATHS.ORDERS.VENDOR_ORDERS // ✅ vendor lihat order miliknya
          : API_PATHS.ORDERS.GET_ALL; // role lain tetap sama

      // Tambahkan filter departemen jika admin/GA
      if (departmentId && ["admin", "general_affair"].includes(userRole)) {
        params.department_id = departmentId;
      }

      const res = await axiosInstance.get(endpoint, { params });
      const data = res.data;

      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };
  const fetchWeeklySummary = async () => {
    try {
      setLoadingWeeklySummary(true);
      const res = await axiosInstance.get(API_PATHS.ORDERS.WEEKLY_STATS);
      setWeeklySummary(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to fetch weekly summary"
      );
    } finally {
      setLoadingWeeklySummary(false);
    }
  };

  /** Fetch Departments */
  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.DEPARTMENTS.GET_ALL);
      let allDepartments = res.data.departments || [];

      // ✅ Jika General Affair, filter hanya yang sesuai lokasi user
      if (userRole === "general_affair" && userLocationId) {
        allDepartments = allDepartments.filter(
          (d) => d.location_id === userLocationId
        );
      }

      setDepartments(allDepartments);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
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
      setError(
        err?.response?.data?.message || "Failed to create backup orders"
      );
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
    if (userRole === "vendor_catering") {
      fetchOrders();
      fetchWeeklySummary();
    } else {
      fetchDepartments();
      fetchOrders();
      fetchOrderStats();
      fetchWeeklySummary();
    }
  }, [userRole, userLocationId, currentPage, departmentId, limit]);

  if (firstLoad && loading) {
    return (
      <DashboardLayout activeMenu="List Order">
        <LoadingSpinner message="Loading Order data..." />
      </DashboardLayout>
    );
  }
  const isVendor = userRole === "vendor_catering";

  return (
    <DashboardLayout activeMenu="List Order">
      <div className="font-poppins">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-black font-semibold text-xl">
              {isVendor ? "My Catering Orders" : "Order Management"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage user orders • Total: {totalItems}
            </p>
          </div>

          {!isVendor && selectedOrders.length > 0 && (
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

        {/* Weekly Summary Section */}
<div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6">
  {loadingWeeklySummary ? (
    <p className="text-gray-500 text-sm">Loading weekly summary...</p>
  ) : weeklySummary ? (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Order Summary ({weeklySummary.week})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Employees:{" "}
            <span className="font-medium">
              {weeklySummary.totalEmployees}
            </span>{" "}
            • Ordered:{" "}
            <span className="text-green-600 font-medium">
              {weeklySummary.totalOrdered}
            </span>{" "}
            • Not Ordered:{" "}
            <span className="text-red-600 font-medium">
              {weeklySummary.totalNotOrdered}
            </span>
          </p>
        </div>
      </div>

      {/* Summary by Day */}
      <div className="space-y-6">
        {weeklySummary.summaryByDay?.length > 0 ? (
          weeklySummary.summaryByDay.map((daySummary, idx) => (
            <div
              key={idx}
              className="border rounded-xl p-4 bg-gray-50 hover:shadow-md transition"
            >
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center justify-between">
                <span>
                  📅 {daySummary.day}
                </span>
                <span className="text-sm text-gray-500">
                  {daySummary.totalMenus} menu(s)
                </span>
              </h4>

              {Object.keys(daySummary.menuSummary || {}).length > 0 ? (
                <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                  <thead className="bg-white text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">Menu Name</th>
                      <th className="px-4 py-2 text-right">Total Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(daySummary.menuSummary).map(
                      ([menuName, total], i) => (
                        <tr
                          key={i}
                          className="border-t hover:bg-white transition"
                        >
                          <td className="px-4 py-2 text-gray-800">
                            {menuName}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {total}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No approved meal orders for this day.
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">
            No meal summary available for this week.
          </p>
        )}
      </div>
    </>
  ) : (
    <p className="text-gray-500 text-sm">No weekly summary available.</p>
  )}
</div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department dropdown */}
          {["admin", "general_affair"].includes(userRole) && (
            <div>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isVendor && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                onChange={(e) => {
                  const startDate = e.target.value;
                  fetchOrders({ start: startDate }); // backend sudah support ?start & ?end
                }}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500 text-sm">Filter by date</span>
            </div>
          )}
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
            <DataTable
              loading={loading}
              data={orders}
              selectable
              selectedIds={selectedOrders}
              onSelectAll={(checked) =>
                setSelectedOrders(checked ? orders.map((o) => o.id) : [])
              }
              onSelectRow={(id, checked) =>
                setSelectedOrders((prev) =>
                  checked ? [...prev, id] : prev.filter((x) => x !== id)
                )
              }
              emptyMessage="No orders found"
              maxHeight="70vh"
              columns={[
                {
                  key: "id",
                  label: "Order ID",
                  render: (o) => (
                    <span className="font-mono text-gray-700">#{o.id}</span>
                  ),
                },
                {
                  key: "order_date",
                  label: "Order Date",
                  render: (o) => moment(o.order_date).format("DD MMM YYYY"),
                },
                {
                  key: "user",
                  label: "User",
                  render: (o) => (
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-xs">
                          {o.user?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-900 font-medium">
                          {o.user?.name || "-"}
                        </p>
                        {o.user?.email && (
                          <p className="text-xs text-gray-500">
                            {o.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (o) => (
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        o.status
                      )}`}
                    >
                      {o.status}
                    </span>
                  ),
                },
                {
                  key: "order_details",
                  label: "Total Items",
                  render: (o) => (
                    <>
                      <span className="font-medium">
                        {o.order_details?.length || 0}
                      </span>{" "}
                      <span className="text-gray-400">items</span>
                    </>
                  ),
                },
                {
                  key: "createdAt",
                  label: "Created At",
                  render: (o) => (
                    <>
                      {moment(o.createdAt).format("DD MMM YYYY")}
                      <br />
                      <span className="text-xs text-gray-400">
                        {moment(o.createdAt).format("HH:mm")}
                      </span>
                    </>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (o) => (
                    <ActionButtons
                      onView={() => openDetailModal(o)}
                      onEdit={
                        !isVendor ? () => openUpdateStatusModal(o) : undefined
                      }
                      onDelete={
                        !isVendor ? () => openDeleteModal(o) : undefined
                      }
                      extraButtons={
                        !isVendor && o.status === "pending"
                          ? [
                              {
                                label: "Approve",
                                icon: (
                                  <svg
                                    className="w-4 h-4 text-green-600"
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
                                ),
                                onClick: () => openApproveModal(o),
                              },
                            ]
                          : []
                      }
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

        {/* Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-5000 p-4">
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
        {!isVendor && showDeleteModal && (
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
        {!isVendor && showApproveModal && (
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
        {!isVendor && showUpdateStatusModal && (
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
