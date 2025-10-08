import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Admin/Dashboard";
import UserDashboard from "./pages/User/UserDashboard";
import { useContext } from "react";

import { AuthContext } from "./context/AuthContext";
import UserList from "./pages/Admin/UserList";
import VendorCateringList from "./pages/Admin/VendorCateringLIST";
import LocationList from "./pages/Admin/LocationList";
import ShiftList from "./pages/Admin/ShiftList";
import RoleList from "./pages/Admin/RoleList";
import DepartmentList from "./pages/Admin/DepartmentList";
import MealMenuList from "./pages/Admin/MealMenuList";
import OrderList from "./pages/Admin/OrderList";
import MealTrayList from "./pages/Admin/MealTrayList"
import OrderForm from "./pages/User/OrderForm";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Admin */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<UserList />} />
          <Route path="/admin/vendor-catering" element={<VendorCateringList />} />
          <Route path="/admin/meal-menu" element={<MealMenuList />} />
          <Route path="/admin/area" element={<Dashboard />} />
          <Route path="/admin/order" element={<OrderList />} />
          <Route path="/admin/order-detail" element={<Dashboard />} />
          <Route path="/admin/review" element={<Dashboard />} />
          <Route path="/admin/complaint" element={<Dashboard />} />
          <Route path="/admin/location" element={<LocationList />} />
          <Route path="/admin/shift" element={<ShiftList />} />
          <Route path="/admin/department" element={<DepartmentList />} />
          <Route path="/admin/role" element={<RoleList />} />
          <Route path="/admin/qr-code" element={<Dashboard />} />
          <Route path="/admin/meal-trays" element={<MealTrayList/>}/>
        </Route>

        {/* Protected General Affair */}
        <Route element={<ProtectedRoute requiredRole="general_affair" />}>
          <Route path="/general-affair/dashboard" element={<Dashboard />} />
          <Route path="/general-affair/users" element={<UserList />}/>
          <Route path="/general-affair/meal-menu" element={<MealMenuList />}/>
        </Route>

        {/* Protected Admin Department */}
        <Route element={<ProtectedRoute requiredRole="admin_department" />}>
          <Route path="/admin-department/dashboard" element={<Dashboard />} />
        </Route>

        {/* Protected Vendor Catering */}
        <Route element={<ProtectedRoute requiredRole="vendor_catering" />}>
          <Route path="/vendor-catering/dashboard" element={<Dashboard />} />
          <Route path="/vendor-catering/meal-menu" element={<MealMenuList />} />
        </Route>

        {/* Protected Employee */}
        <Route element={<ProtectedRoute requiredRole="employee" />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/order" element={<OrderForm/>}/>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />

        <Route path="/" element={<Root />} />

      </Routes>
    </Router>
  );
}

export default App;

const Root = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Outlet />;

  if (!user) return <Navigate to="/login" />;

  return user.role.name === "admin" ? <Navigate to="/admin/dashboard" /> :
         user.role.name === "general_affair" ? <Navigate to="/general-affair/dashboard" /> :
         user.role.name === "admin_department" ? <Navigate to="/admin-department/dashboard" /> :
        user.role.name === "vendor_catering" ? <Navigate to="/vendor-catering/dashboard" /> :
         user.role.name === "employee" ? <Navigate to="/dashboard" /> :
         <div>Role tidak dikenali</div>; 
};