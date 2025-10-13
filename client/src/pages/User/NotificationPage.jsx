import React, { useEffect, useState } from "react";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { PageContainer } from "../../components/common/PageContainer";
import MobileLayout from "../../components/mobile/MobileLayout";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Mock data (dummy notifikasi)
  const mockNotifications = [
    {
      id: 1,
      title: "Order Approved ✅",
      message: "Your lunch order for next week has been approved by the admin.",
      is_read: false,
      created_at: "2025-10-10T08:30:00Z",
    },
    {
      id: 2,
      title: "New Menu Available 🍛",
      message: "Check out the latest meal options for next week!",
      is_read: true,
      created_at: "2025-10-09T14:10:00Z",
    },
    {
      id: 3,
      title: "Password Updated 🔒",
      message: "Your account password was successfully changed.",
      is_read: true,
      created_at: "2025-10-07T17:45:00Z",
    },
    {
      id: 4,
      title: "QR Code Generated 🎫",
      message: "Your new canteen QR code is now ready to use.",
      is_read: false,
      created_at: "2025-10-06T11:15:00Z",
    },
  ];

  // ✅ Simulasi fetch data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1200);
  }, []);

  // ✅ Loading full screen
  if (loading) {
    return (
      <MobileLayout>
        <LoadingSpinner text="Loading notifications..." />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PageContainer>
        <div className="px-4 py-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
          </div>

          {/* Empty State */}
          {notifications.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md">
              <Bell className="w-10 h-10 mx-auto text-primary-400 mb-3" />
              <h3 className="text-gray-600 font-medium">
                No notifications yet 📭
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                You’ll see updates and order info here.
              </p>
            </div>
          )}

          {/* Notification List */}
          {notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`bg-white border rounded-2xl p-4 shadow-sm flex items-start justify-between transition-all ${
                    notif.is_read
                      ? "border-gray-200"
                      : "border-primary-300 bg-primary-50"
                  }`}
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {notif.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>

                  {notif.is_read && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 ml-3 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </MobileLayout>
  );
};

export default NotificationsPage;
