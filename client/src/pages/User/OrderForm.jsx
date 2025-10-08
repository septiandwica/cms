import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { AuthContext } from "../../context/AuthContext";
import { Loader2, CalendarDays, CheckCircle2 } from "lucide-react";

const OrderForm = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [shifts, setShifts] = useState([]);
  const [menusByDate, setMenusByDate] = useState({}); // <── per date
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedMenus, setSelectedMenus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 📅 Calculate next week (Mon–Fri)
  const nextMonday = moment().add(1, "weeks").startOf("isoWeek");
  const nextWeekDays = Array.from({ length: 5 }, (_, i) =>
    moment(nextMonday).add(i, "days")
  );

  // 🕓 Check order window: Wed–Fri only
  const today = moment();
  const currentDay = today.isoWeekday(); // 1=Mon ... 7=Sun
  const canOrder = currentDay >= 3 && currentDay <= 5;

  // 🔹 Fetch shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.SHIFTS.GET_ALL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShifts(res.data.shifts || res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchShifts();
  }, [token]);

  // 🔹 Fetch menus when shift changes
  useEffect(() => {
    if (!selectedShift) return;
    const fetchMenus = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.MEAL_MENUS.GET_ALL, {
          headers: { Authorization: `Bearer ${token}` },
          params: { shift_id: selectedShift },
        });

        // Dapatkan data array menu
        const allMenus =
          res.data.meal_menus ||
          res.data.mealMenus ||
          res.data.data ||
          res.data ||
          [];

        // Filter menu sesuai shift yang dipilih
        const filteredByShift = allMenus.filter(
          (m) =>
            m.vendor_catering?.shift_id === parseInt(selectedShift, 10)
        );

        // Group by date
        const grouped = filteredByShift.reduce((acc, menu) => {
          const date = menu.for_date;
          if (!acc[date]) acc[date] = [];
          acc[date].push(menu);
          return acc;
        }, {});

        setMenusByDate(grouped);
      } catch (err) {
        console.error("Error fetching menus:", err);
        setMenusByDate({});
      }
    };
    fetchMenus();
  }, [selectedShift, token]);

  // 🧾 Handle menu selection
  const handleMenuSelect = (day, menuId) => {
    setSelectedMenus((prev) => ({ ...prev, [day]: menuId }));
  };

  // ✅ Submit weekly order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const orders = nextWeekDays.map((day) => ({
        shift_id: selectedShift,
        meal_menu_id: selectedMenus[day.format("YYYY-MM-DD")],
      }));

      const res = await axiosInstance.post(
        API_PATHS.ORDERS.CREATE,
        { orders },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 201) {
        setSuccess(res.data.message || "Order created successfully!");
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!canOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <CalendarDays className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Ordering Closed
          </h2>
          <p className="text-gray-600 text-sm">
            You can only place orders from <strong>Wednesday to Friday</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 font-sans p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-2xl border-2 border-blue-500">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Weekly Order Form
        </h1>

        {/* Shift Selection */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-2">
            Select Shift
          </label>
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">-- Choose Shift --</option>
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name}
              </option>
            ))}
          </select>
        </div>

        {/* Menu Selection per Day */}
        {selectedShift && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {nextWeekDays.map((day) => {
                const dateStr = day.format("YYYY-MM-DD");
                const menusForDay = menusByDate[dateStr] || [];
                return (
                  <div
                    key={dateStr}
                    className="p-4 border rounded-xl bg-gray-50"
                  >
                    <h3 className="font-semibold mb-2 text-gray-700">
                      {day.format("dddd, MMMM D")}
                    </h3>
                    <select
                      value={selectedMenus[dateStr] || ""}
                      onChange={(e) =>
                        handleMenuSelect(dateStr, e.target.value)
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">-- Select Menu --</option>
                      {menusForDay.length > 0 ? (
                        menusForDay.map((menu) => (
                          <option key={menu.id} value={menu.id}>
                            {menu.name} - {menu.descriptions}
                          </option>
                        ))
                      ) : (
                        <option disabled>No menu available</option>
                      )}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Error / Success */}
            {error && (
              <div className="bg-red-100 text-red-700 mt-4 p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 text-green-700 mt-4 p-3 rounded-lg text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                "Submit Order"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderForm;
