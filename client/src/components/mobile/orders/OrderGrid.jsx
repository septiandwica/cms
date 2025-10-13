import React from "react";
import { OrderCard } from "./OrderCard";

export const OrdersGrid = ({ orders, onOrderClick }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
          <CalendarDays className="w-10 h-10 text-primary-400" />
        </div>
        <p className="text-gray-600 text-lg">Belum ada pesanan yang dibuat.</p>
        <p className="text-gray-500 text-sm mt-2">Mulai pesan menu mingguan Anda sekarang!</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onClick={() => onOrderClick(order.id)}
        />
      ))}
    </div>
  );
};
