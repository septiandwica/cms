import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SIDE_MENU_DATA } from "../../utils/data";

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(AuthContext);
  const [sideMenuData, setSideMenuData] = useState([]);
  const navigate = useNavigate();

  const handleClick = (path, label) => {
    if (path === "/logout") {
      handleLogout();
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/login");
  };

  useEffect(() => {
    if (user) {
      const userRole =
        typeof user.role === "object" ? user.role.name : user.role;

      setSideMenuData(SIDE_MENU_DATA[userRole] || []);
    }
  }, [user]);

  return (
    <div className="w-64 h-[calc(100vh-61px)] bg-white border-r border-gray-100">
      {/* User Info */}
      <div className="p-6 flex flex-col justify-center items-center border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {user?.name
              ?.split(" ")
              .map((word) => word.charAt(0))
              .join("")
              .toUpperCase() || "U"}
          </div>
        </div>
        {user?.role && (
          <div className="inline-block px-2 py-1 bg-primary-600 text-white text-xs font-semibold rounded-xl mb-2">
            {typeof user.role === "object" ? user.role.name : user.role}
          </div>
        )}
        <div className="text-center">
          <h5 className="text-lg font-semibold text-black font-poppins">
            {user?.name || ""}
          </h5>
          <p className="text-sm text-gray-500 font-poppins">{user?.email || ""}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="py-4">
        {sideMenuData.map((item, index) => (
          <button
            key={`menu_${index}`}
            className={`w-full flex items-center gap-4 text-sm py-3 mb-1 mx-1 transition-all duration-200 ease-in-out font-poppins ${
              activeMenu === item.label
                ? "text-black bg-primary-200 border-r-4 border-primary-500"
                : "text-black hover:bg-primary-100"
            }`}
            onClick={() => handleClick(item.path, item.label)}
          >
            <item.icon
              className={`w-5 h-5 ml-3 transition-colors duration-200 ${
                activeMenu === item.label ? "text-primary-600" : "text-gray-600"
              }`}
            />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SideMenu;