import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { AuthContext } from "../../context/AuthContext";

import { PageContainer } from "../../components/common/PageContainer";
import { ContentCard } from "../../components/common/ContentCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { OrdersHeader } from "../../components/mobile/orders/OrderHeader";
import { OrdersGrid } from "../../components/mobile/orders/OrderGrid";
import MobileLayout from "../../components/mobile/MobileLayout"; // ✅ tambahkan ini

const RecentOrdersEmployee = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.ORDERS.MY_ORDERS, {
          withCredentials: true,
        });
        const myOrders = res.data.orders || [];
        setOrders(myOrders);
      } catch (err) {
        console.error("❌ Error fetching my orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchMyOrders();
  }, [user]);

  const handleOrderClick = (orderId) => {
    navigate(`/order/recent/${orderId}`);
  };

  if (loading) {
    return (
      <MobileLayout>
        <LoadingSpinner />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PageContainer>
        <div className="px-4 py-6">
          <ContentCard>
            <OrdersHeader title="Recent Orders" ordersCount={orders.length} />

            {orders.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Kamu belum memiliki pesanan minggu ini.
              </div>
            ) : (
              <OrdersGrid orders={orders} onOrderClick={handleOrderClick} />
            )}
          </ContentCard>
        </div>
      </PageContainer>
    </MobileLayout>
  );
};

export default RecentOrdersEmployee;
