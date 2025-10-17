import React from "react";
import moment from "moment";
import { CalendarDays } from "lucide-react";

export const OrderCard = ({ order, onClick }) => {
  const firstDay = order.order_details?.[0]?.day;
  const lastDay = order.order_details?.[order.order_details.length - 1]?.day;



  return (
    <button
      onClick={onClick}
      className="text-left p-6 rounded-2xl border-2 border-primary-200 hover:shadow-xl bg-white hover:bg-primary-50 transition-all w-full"
    >
      <div className="flex justify-between items-start mb-3">
        <h2 className="font-bold text-lg text-gray-800">
          Periode {moment(firstDay).format("DD MMM")} -{" "}
          {moment(lastDay).format("DD MMM YYYY")}
        </h2>
       
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Dibuat: {moment(order.createdAt).format("dddd, DD MMM YYYY")}
      </p>
      <div className="flex items-center gap-2 text-primary-600 font-semibold">
        <CalendarDays className="w-4 h-4" />
        <span className="text-sm">{order.order_details?.length || 0} menu mingguan</span>
      </div>
    </button>
  );
};