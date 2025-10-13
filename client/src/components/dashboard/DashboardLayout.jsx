import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Navbar } from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Navbar tetap di atas */}
      <Navbar activeMenu={activeMenu} />

      {user && (
        <div className="flex">
          {/* 🔹 SideMenu hanya muncul di layar besar */}
          <div className="hidden lg:block fixed top-[61px] left-0 h-[calc(100vh-61px)] w-64 pt-5 border-r border-gray-100 bg-white z-40">
            <SideMenu activeMenu={activeMenu} />
          </div>

          {/* 🔹 Konten utama punya margin kiri hanya di layar besar */}
          <main className="flex-1 lg:ml-64 p-5 overflow-y-auto transition-all duration-300">
            {children}
          </main>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
