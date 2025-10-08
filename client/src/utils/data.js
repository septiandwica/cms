import {
  LayoutDashboard,
  Users,
  Store,
  UtensilsCrossed,
  ShoppingCart,
  FileText,
  Star,
  MessageSquare,
  Building2,
  MapPin,
  Shield,
  QrCode,
  Shuffle,
  LogOutIcon,
  User,
} from "lucide-react";

export const SIDE_MENU_DATA = {
  admin: [
    {
      id: "01",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
    },
    { id: "02", label: "User", icon: Users, path: "/admin/users" },
    {
      id: "03",
      label: "Vendor Catering",
      icon: Store,
      path: "/admin/vendor-catering",
    },
    {
      id: "04",
      label: "Meal Menu",
      icon: UtensilsCrossed,
      path: "/admin/meal-menu",
    },
    { id: "05", label: "Order", icon: ShoppingCart, path: "/admin/order" },
    {
      id: "06",
      label: "Order Detail",
      icon: FileText,
      path: "/admin/order-detail",
    },
    { id: "07", label: "Review", icon: Star, path: "/admin/review" },
    {
      id: "08",
      label: "Complaint",
      icon: MessageSquare,
      path: "/admin/complaint",
    },
    {
      id: "09",
      label: "Department",
      icon: Building2,
      path: "/admin/department",
    },
    { id: "15", label: "Meal Tray", icon: UtensilsCrossed, path:"/admin/meal-trays"},

    { id: "10", label: "Location", icon: MapPin, path: "/admin/location" },
    { id: "11", label: "Shift", icon: Shuffle, path: "/admin/shift" },
    { id: "12", label: "Role", icon: Shield, path: "/admin/role" },
    { id: "13", label: "QR Code", icon: QrCode, path: "/admin/qr-code" },
    { id: "14", label: "Logout", icon: LogOutIcon, path: "/logout" }
  ],

  general_affair: [
    {
      id: "01",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/general-affair/dashboard",
    },
    { id: "01", label: "Meal Menu", icon: UtensilsCrossed, path: "/general-affair/meal-menu" },
    {
      id: "01",
      label: "User",
      icon: User,
      path: "/general-affair/users",
    },

    {
      id: "02",
      label: "Complaint",
      icon: MessageSquare,
      path: "/general-affair/complaint",
    },
    {
      id: "03",
      label: "Location",
      icon: MapPin,
      path: "/general-affair/location",
    },
    { id: "04", label: "Logout", icon: LogOutIcon, path: "/logout" },

  ],

  admin_department: [
    {
      id: "01",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin-department/dashboard",
    },
    {
      id: "02",
      label: "Department",
      icon: Building2,
      path: "/admin-department/department",
    },
    {
      id: "03",
      label: "Complaint",
      icon: MessageSquare,
      path: "/admin-department/complaint",
    },
    { id: "04", label: "Logout", icon: LogOutIcon, path: "/logout" },
  ],

  vendor_catering: [
    {
      id: "01",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/vendor_catering/dashboard",
    },
    {
      id: "02",
      label: "Meal Menu",
      icon: UtensilsCrossed,
      path: "/vendor-catering/meal-menu",
    },
    {
      id: "03",
      label: "Order",
      icon: ShoppingCart,
      path: "/vendor-catering/order",
    },
    { id: "04", label: "Review", icon: Star, path: "/vendor_catering/review" },
    {
      id: "05",
      label: "QR Code",
      icon: QrCode,
      path: "/vendor-catering/qr-code",
    },
    { id: "06", label: "Logout", icon: LogOutIcon, path: "/logout" },
  ],

  employee: [
    {
      id: "01",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/employee/dashboard",
    },
    { id: "02", label: "Order", icon: ShoppingCart, path: "/employee/order" },
    { id: "03", label: "Review", icon: Star, path: "/employee/review" },
    {
      id: "04",
      label: "Complaint",
      icon: MessageSquare,
      path: "/employee/complaint",
    },
    { id: "05", label: "Logout", icon: LogOutIcon, path: "/logout" },
  ],
};
