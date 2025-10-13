import React, { useContext, useEffect, useState } from "react";
import moment from "moment";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { AuthContext } from "../../context/AuthContext";
import { Loader2, ChefHat, CalendarDays, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../../components/common/PageContainer";
import MobileLayout from "../../components/mobile/MobileLayout"; // ✅ Tambahkan ini
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const OrderDetail = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyOrderDetails = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.ORDER_DETAILS.GET_MY);
        const details = res.data.orderDetails || [];

        if (!details.length) {
          setOrderData(null);
          return;
        }

        const orderLike = {
          createdAt: details[0].order?.createdAt,
          status: details[0].order?.status,
          order_details: details,
        };

        setOrderData(orderLike);
      } catch (err) {
        console.error("❌ Error fetching my order details:", err);
        setOrderData(null);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchMyOrderDetails();
  }, [user]);

  // ==============================
  // LOADING STATE
  // ==============================
  if (loading) {
    return (
      <MobileLayout>
        <LoadingSpinner />
      </MobileLayout>
    );
  }

  // ==============================
  // EMPTY STATE
  // ==============================
  if (!orderData) {
    return (
      <MobileLayout>
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
            <p className="text-gray-600 text-lg mb-3">
              Kamu belum membuat pesanan untuk minggu ini.
            </p>
            <button
              onClick={() => navigate("/order")}
              className="mt-4 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-all"
            >
              Buat Pesanan
            </button>
          </div>
        </PageContainer>
      </MobileLayout>
    );
  }

  const { order_details = [] } = orderData;

  return (
    <MobileLayout>
      <PageContainer>
        {/* Content */}
        <div className="px-4 py-6">
          {/* Status Pill */}
          <div className="flex justify-center mb-6">
            <span
              className={`px-4 py-1 rounded-full text-sm font-semibold ${
                orderData.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {(orderData.status || "pending").toUpperCase()}
            </span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-gray-800 flex justify-center items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary-600" />
              Detail Pesanan Kamu
            </h1>

            {order_details.length > 0 && (
              <p className="text-gray-600 mt-2">
                Periode{" "}
                <strong className="text-primary-700">
                  {moment(order_details[0].day).format("DD MMM")} -{" "}
                  {moment(order_details[order_details.length - 1].day).format(
                    "DD MMM YYYY"
                  )}
                </strong>
              </p>
            )}
          </div>

          {/* Order List */}
          <div className="space-y-4">
            {order_details.map((detail) => (
              <div
                key={detail.id}
                className="bg-white border border-primary-200 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  {/* Left Info */}
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-base">
                      {moment(detail.day).format("dddd, DD MMM")}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 leading-snug">
                      {detail.meal_menu?.name || "Menu tidak tersedia"}
                      {detail.meal_menu?.descriptions && (
                        <span className="text-gray-500">
                          {" "}
                          — {detail.meal_menu.descriptions}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                      <ChefHat className="w-4 h-4" />
                      {detail.meal_menu?.vendor_catering?.name || "Catering"}
                    </div>
                  </div>

                  {/* Right Info */}
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3">
                    {detail.shift_id ? `Shift ${detail.shift_id}` : "Shift ?"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer info */}
          <div className="mt-10 text-center text-gray-500 text-sm">
            <div className="flex justify-center items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>
                Dibuat pada{" "}
                <strong>
                  {moment(orderData.createdAt).format("dddd, DD MMM YYYY")}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </PageContainer>
    </MobileLayout>
  );
};

export default OrderDetail;
