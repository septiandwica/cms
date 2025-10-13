import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { AuthContext } from "../../context/AuthContext";
import { Loader2, CalendarDays, CheckCircle2, Lock } from "lucide-react";
import { PageContainer } from "../../components/common/PageContainer";
import MobileLayout from "../../components/mobile/MobileLayout";
import { LoadingSpinner } from "../../components/common/LoadingSpinner"; // ✅ import spinner elegan

const OrderForm = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [shifts, setShifts] = useState([]);
  const [menusByDate, setMenusByDate] = useState({});
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedMenus, setSelectedMenus] = useState({});
  const [loading, setLoading] = useState(true); // ⬅️ default true (tampilkan spinner saat awal)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alreadyOrdered, setAlreadyOrdered] = useState(false);

  // ✅ Hitung tanggal minggu depan
  const nextMonday = moment().add(1, "weeks").startOf("isoWeek");
  const nextFriday = moment(nextMonday).add(4, "days");
  const nextWeekDays = Array.from({ length: 5 }, (_, i) =>
    moment(nextMonday).add(i, "days")
  );

  const today = moment();
  const currentDay = today.isoWeekday();
  const currentTime = today.hour();
  const canOrder =
    (currentDay === 4 && currentTime >= 0) ||
    currentDay === 5 ||
    (currentDay === 6 && currentTime < 12);

  // ✅ Ambil data shift
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [shiftRes, orderRes] = await Promise.all([
          axiosInstance.get(API_PATHS.SHIFTS.GET_ALL),
          axiosInstance.get(API_PATHS.ORDERS.CHECK_WEEKLY, {
            params: { week_start: nextMonday.format("YYYY-MM-DD") },
          }),
        ]);

        setShifts(shiftRes.data.shifts || shiftRes.data || []);
        const ordered = orderRes.data.alreadyOrdered || false;
        setAlreadyOrdered(ordered);

        if (ordered) navigate("/recent-order");
      } catch (err) {
        console.error("Init load error:", err);
        setError("Gagal memuat data awal.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchInitialData();
  }, [user]);

  // ✅ Ambil menu berdasarkan shift
  useEffect(() => {
    if (!selectedShift) return;

    const fetchMenus = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          API_PATHS.MEAL_MENUS.GET_NEXT_WEEK,
          {
            params: { shift_id: selectedShift },
          }
        );

        const allMenus =
          res.data.meal_menus ||
          res.data.mealMenus ||
          res.data.data ||
          res.data ||
          [];

        const filtered = allMenus.filter(
          (m) =>
            m.vendor_catering?.shift?.id === parseInt(selectedShift, 10) &&
            m.status?.toLowerCase() === "approved"
        );

        const grouped = filtered.reduce((acc, menu) => {
          const date = menu.for_date;
          if (!acc[date]) acc[date] = [];
          acc[date].push(menu);
          return acc;
        }, {});

        setMenusByDate(grouped);
      } catch (err) {
        console.error("Error fetching menus:", err);
        setError("Gagal memuat menu.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [selectedShift]);

  const handleMenuSelect = (day, menuId) =>
    setSelectedMenus((prev) => ({ ...prev, [day]: menuId }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const orders = nextWeekDays.map((day) => ({
        shift_id: selectedShift,
        meal_menu_id: selectedMenus[day.format("YYYY-MM-DD")],
      }));

      const res = await axiosInstance.post(API_PATHS.ORDERS.CREATE, { orders });

      if (res.status === 201) {
        setSuccess(res.data.message || "Order berhasil dibuat!");
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal membuat order.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Saat loading tampilkan spinner di tengah layar
  if (loading) {
    return (
      <MobileLayout>
        <LoadingSpinner text="Memuat data pemesanan..." />
      </MobileLayout>
    );
  }

  // ✅ Layout utama
  return (
    <MobileLayout>
      <PageContainer>
        <div className="px-4 py-6 space-y-6">
          {/* Sudah memesan */}
          {alreadyOrdered ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md">
              <Lock className="w-12 h-12 mx-auto text-primary-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Kamu sudah memesan 🎉
              </h2>
              <p className="text-gray-600">
                Periode {nextMonday.format("DD MMM")} -{" "}
                {nextFriday.format("DD MMM")}
              </p>
            </div>
          ) : !canOrder ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md">
              <CalendarDays className="w-12 h-12 mx-auto text-primary-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Belum Waktunya Order 📅
              </h2>
              <p className="text-gray-600">
                Pemesanan dibuka dari <b>Kamis sampai Sabtu (sebelum jam 12)</b>
              </p>
            </div>
          ) : (
            <>
              {/* Pilih shift */}
              <div className="bg-white p-5 rounded-2xl shadow-md">
                <label className="block font-semibold mb-2">
                  Pilih Shift Kamu
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                >
                  <option value="">-- Pilih Shift --</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daftar menu */}
              {selectedShift && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {nextWeekDays.map((day) => {
                    const dateStr = day.format("YYYY-MM-DD");
                    const menus = menusByDate[dateStr] || [];

                    return (
                      <div
                        key={dateStr}
                        className="bg-white p-5 rounded-2xl shadow-md"
                      >
                        <h3 className="font-bold text-lg mb-3">
                          {day.format("dddd, DD MMM")}
                        </h3>
                        {menus.length === 0 ? (
                          <p className="text-gray-500 text-center py-6">
                            Tidak ada menu untuk hari ini
                          </p>
                        ) : (
                          menus.map((menu) => {
                            const selected = selectedMenus[dateStr] === menu.id;
                            return (
                              <button
                                type="button"
                                key={menu.id}
                                onClick={() =>
                                  handleMenuSelect(dateStr, menu.id)
                                }
                                className={`w-full text-left p-4 mb-3 rounded-xl border ${
                                  selected
                                    ? "border-primary-500 bg-primary-50"
                                    : "border-gray-200"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">
                                      {menu.name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {menu.descriptions}
                                    </p>
                                  </div>
                                  {selected && (
                                    <CheckCircle2 className="w-6 h-6 text-primary-600" />
                                  )}
                                </div>
                                {menu.vendor_catering?.vendor?.name && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    👨‍🍳 {menu.vendor_catering.vendor.name}
                                  </p>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    );
                  })}

                  {/* Pesan feedback */}
                  {error && (
                    <div className="bg-red-100 text-red-800 p-4 rounded-lg text-center">
                      ⚠️ {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center">
                      ✅ {success}
                    </div>
                  )}

                  {/* Tombol kirim */}
                  <button
                    type="submit"
                    disabled={
                      loading || Object.keys(selectedMenus).length !== 5
                    }
                    className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Memproses...
                      </span>
                    ) : (
                      `Konfirmasi Pesanan (${
                        Object.keys(selectedMenus).length
                      }/5)`
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </MobileLayout>
  );
};

export default OrderForm;
