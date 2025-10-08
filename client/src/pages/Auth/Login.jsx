import { useState, useContext } from "react";
import { ChefHat, Mail, Lock, Eye, EyeOff, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { validateEmail } from "../../utils/helper";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { updateUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validasi email
    if (!validateEmail(email)) {
      setError("Please enter a valid email address!");
      setLoading(false);
      return;
    }

    // Validasi password
    if (!password) {
      setError("Please enter a password!");
      setLoading(false);
      return;
    }

    setError("");

    try {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.LOGIN,
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { token, user } = response.data || {};
        if (token && user) {
          updateUser(user, token);

          const userRole = user?.role?.name?.toLowerCase();
          switch (userRole) {
            case "admin":
              navigate("/admin/dashboard");
              break;
            case "general_affair":
              navigate("/general-affair/dashboard");
              break;
            case "admin_department":
              navigate("/admin-department/dashboard");
              break;
            case "vendor_catering":
              navigate("/vendor-catering/dashboard");
              break;
            case "employee":
              navigate("/dashboard");
              break;
            default:
              navigate("/login");
              break;
          }
        }
      }
    } catch (err) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-white font-poppins">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-300 rounded-full opacity-15 animate-pulse animate-delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary-200 rounded-full opacity-20 animate-pulse animate-delay-500"></div>
      </div>

      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md relative z-10 border-2 border-primary-500 mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-4 shadow-lg">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl text-black mb-2 font-bold">
            Meal<span className="text-primary-500">Hub</span>
          </h1>
          <p className="text-gray-600"></p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-black flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary-500" />
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:bg-white focus:outline-none transition-all duration-200 text-black"
                placeholder="admin@catering.com"
              />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-black flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-500" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pl-12 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:bg-white focus:outline-none transition-all duration-200 text-black"
                placeholder="••••••••"
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100 transition-all duration-200 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Loggiing in...
              </>
            ) : (
              <>
                <Utensils className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            <button className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
              Lupa Password ?
            </button>
          </p>
          <p className="text-center text-xs text-gray-500 mt-3">
            © {currentYear} MealHub! <br />
            Bintang Toedjoe Catering Management System.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
