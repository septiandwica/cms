import React, { useContext, useState, useRef, useEffect } from "react";
import SideMenu from "./SideMenu";
import {
  X,
  Menu,
  UtensilsCrossed,
  Bell,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [notifications] = useState(3);
  const { user, clearUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const navbarRef = useRef(null);
  const [navbarHeight, setNavbarHeight] = useState(0);

  // 🔹 Hitung tinggi navbar secara dinamis
  useEffect(() => {
    if (navbarRef.current) {
      setNavbarHeight(navbarRef.current.offsetHeight);
    }
    const handleResize = () => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/login");
  };

  const getUserInitials = () =>
    user?.name
      ?.split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "U";

  return (
    <>
      {/* 🔹 Navbar dinamis */}
   <nav
  ref={navbarRef}
  className="sticky top-0 left-0 right-0 w-full flex items-center justify-between bg-white/80 border-b border-gray-100 backdrop-blur-md py-3 sm:py-4 px-4 sm:px-6 md:px-8 z-[1000] shadow-sm transition-all duration-300"
>
        {/* Left Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2 rounded-xl shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              MealHub
            </h1>
          </div>

          {/* Toggle Menu (Mobile) */}
          <button
            className="block lg:hidden text-gray-700 hover:text-primary-600 transition-colors p-2 hover:bg-primary-50 rounded-lg"
            onClick={() => setOpenSideMenu(!openSideMenu)}
            aria-label="Toggle menu"
          >
            {openSideMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          
        </div>

        {/* Right Section */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <button
              className="relative p-2 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setOpenProfileMenu(!openProfileMenu)}
                className="flex items-center gap-2 hover:bg-primary-50 p-2 rounded-lg transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {getUserInitials()}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-800 leading-tight">
                    {user?.name || "User"}
                  </span>
                  {user?.role && (
                    <span className="text-xs text-gray-500">
                      {typeof user.role === "object"
                        ? user.role.name
                        : user.role}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform hidden md:block ${
                    openProfileMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {openProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpenProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg">
                            {typeof user.role === "object"
                              ? user.role.name
                              : user.role}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setOpenProfileMenu(false);
                          navigate("/profile");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 🔹 Mobile Side Menu (dinamis mengikuti tinggi navbar) */}
      {openSideMenu && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setOpenSideMenu(false)}
          />
          <div
            className="fixed left-0 bg-white shadow-2xl z-50 lg:hidden w-64 overflow-y-auto transition-transform duration-300"
            style={{
              top: `${navbarHeight}px`,
              bottom: 0,
            }}
          >
            <SideMenu activeMenu={activeMenu} />
          </div>
        </>
      )}
    </>
  );
};
