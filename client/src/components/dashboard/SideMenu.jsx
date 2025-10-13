import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SIDE_MENU_DATA } from "../../utils/data";
import { ChevronDown, ChevronRight } from "lucide-react";

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(AuthContext);
  const [sideMenuData, setSideMenuData] = useState([]);
  const [logoutItem, setLogoutItem] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
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

  const toggleGroup = (groupLabel) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  useEffect(() => {
    if (user) {
      const userRole =
        typeof user.role === "object" ? user.role.name : user.role;
      const menuData = SIDE_MENU_DATA[userRole] || [];
      
      // Pisahkan logout dari menu lainnya
      const logout = menuData.find(item => item.path === "/logout");
      const otherMenus = menuData.filter(item => item.path !== "/logout");
      
      setSideMenuData(otherMenus);
      setLogoutItem(logout);

      // Auto expand groups yang memiliki active menu
      const newExpandedGroups = {};
      otherMenus.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => child.label === activeMenu);
          if (hasActiveChild) {
            newExpandedGroups[item.label] = true;
          }
        }
      });
      setExpandedGroups(newExpandedGroups);
    }
  }, [user, activeMenu]);

  const renderMenuItem = (item, index, isChild = false) => {
    const isActive = activeMenu === item.label;
    
    // Jika item memiliki children (group menu)
    if (item.children) {
      const isExpanded = expandedGroups[item.label];
      
      return (
        <div key={`menu_${index}`}>
          <button
            className={`w-full flex items-center justify-between text-sm py-3 mb-1 mx-1 transition-all duration-200 ease-in-out font-poppins text-black hover:bg-primary-100 ${
              isChild ? 'pl-8' : ''
            }`}
            onClick={() => toggleGroup(item.label)}
          >
            <div className="flex items-center gap-4">
              <item.icon className={`w-5 h-5 ${isChild ? 'ml-5' : 'ml-3'} text-gray-600`} />
              <span className="font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-3 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-3 text-gray-600" />
            )}
          </button>
          
          {/* Submenu */}
          {isExpanded && (
            <div className="ml-4">
              {item.children.map((child, childIndex) => 
                renderMenuItem(child, childIndex, true)
              )}
            </div>
          )}
        </div>
      );
    }

    // Menu item biasa
    return (
      <button
        key={`menu_${index}`}
        className={`w-full flex items-center gap-4 text-sm py-3 mb-1 mx-1 transition-all duration-200 ease-in-out font-poppins ${
          isActive
            ? "text-black bg-primary-200 border-r-4 border-primary-500"
            : "text-black hover:bg-primary-100"
        } ${isChild ? 'pl-4' : ''}`}
        onClick={() => handleClick(item.path, item.label)}
      >
        <item.icon
          className={`w-5 h-5 ${isChild ? 'ml-9' : 'ml-3'} transition-colors duration-200 ${
            isActive ? "text-primary-600" : "text-gray-600"
          }`}
        />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="w-64 h-[calc(100vh-61px)] bg-white border-r border-gray-100">
      {/* Main Menu */}
      <div className="py-4">
        {sideMenuData.map((item, index) => renderMenuItem(item, index))}

        {/* Logout Button - Separated with spacing */}
        {logoutItem && (
          <div className="mt-6 pt-4 border-t border-gray-200 mx-4">
            <button
              className="w-full flex items-center gap-4 text-sm py-3 px-3 transition-all duration-200 ease-in-out font-poppins text-red-600 hover:bg-red-50 rounded-lg group"
              onClick={() => handleClick(logoutItem.path, logoutItem.label)}
            >
              <logoutItem.icon className="w-5 h-5 transition-colors duration-200 group-hover:text-red-700" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideMenu;