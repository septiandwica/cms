import { useState, useContext } from "react";
import { ChefHat, Mail, Lock, Eye, EyeOff, Utensils, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { API_PATHS } from "../../services/apiPaths";
import { validateEmail } from "../../utils/helper";
import { AuthContext } from "../../context/AuthContext";
import StatusModal from "../../components/common/StatusModal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "",
    message: "",
  });
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const { updateUser, clearUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address!");
      setLoading(false);
      return;
    }

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
          const status = user.status?.toLowerCase();

          if (status === "inactive") {
            setStatusModal({
              open: true,
              type: "inactive",
              message:
                "Your account is no longer active. Please contact the HR or General Affair department for clarification.",
            });
            return;
          }

          if (status === "suspend" || status === "suspended") {
            setStatusModal({
              open: true,
              type: "suspend",
              message:
                "Your account is suspended due to SOP violations in meal ordering. Please contact General Affair to reactivate your account.",
            });
            return;
          }

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
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {statusModal.open && (
        <StatusModal
          type={statusModal.type}
          message={statusModal.message}
          onClose={() => {
            setStatusModal({ open: false, type: "", message: "" });
            clearUser();
            navigate("/login");
          }}
        />
      )}

      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 font-poppins relative overflow-hidden">
        {/* Enhanced Background Decoration - Food themed */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Desktop decorations */}
          <div className="hidden lg:block absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-orange-300 to-amber-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="hidden lg:block absolute bottom-20 right-10 w-52 h-52 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-25 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="hidden lg:block absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full opacity-15 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          
          {/* Mobile/Tablet decorations - smaller & optimized */}
          <div className="lg:hidden absolute top-5 right-5 w-24 h-24 bg-gradient-to-br from-orange-300 to-amber-400 rounded-full opacity-20 blur-2xl animate-pulse"></div>
          <div className="lg:hidden absolute bottom-10 left-5 w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Floating food icons decoration */}
          <div className="hidden md:block absolute top-1/4 right-1/4 opacity-10">
            <Utensils className="w-16 h-16 text-primary-500 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          <div className="hidden md:block absolute bottom-1/3 left-1/3 opacity-10">
            <ChefHat className="w-12 h-12 text-primary-500 animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>

        {/* Login Container - Responsive */}
        <div className="w-full max-w-md lg:max-w-lg relative z-10">
          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-primary-400/30 hover:border-primary-500/50 transition-all duration-300">
            
            {/* Header Section */}
            <div className="text-center mb-6 sm:mb-8">
              {/* Logo with appetizing animation */}
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl lg:rounded-3xl mb-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative">
                <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white animate-pulse" />
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-ping" />
              </div>
              
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl text-gray-800 mb-2 font-bold tracking-tight">
                Welcome to <span className="text-primary-500 inline-block hover:scale-110 transition-transform duration-300">Meal</span><span className="text-primary-600 inline-block hover:scale-110 transition-transform duration-300">Hub</span>
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Delicious meals, just a click away! 🍽️</p>
            </div>

            {/* Login Form */}
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              {/* Error Message - Enhanced */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-3 sm:p-4 rounded-xl shadow-sm animate-shake">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse"></div>
                    <p className="text-red-700 text-xs sm:text-sm font-medium leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Input - Enhanced */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 sm:py-3.5 lg:py-4 pl-11 sm:pl-12 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:border-primary-500 focus:from-primary-50 focus:to-white focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-300 text-gray-800 text-sm sm:text-base placeholder:text-gray-400 group-hover:border-primary-300"
                    placeholder="your.email@company.com"
                  />
                  <Mail className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-300" />
                </div>
              </div>

              {/* Password Input - Enhanced */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 sm:py-3.5 lg:py-4 pl-11 sm:pl-12 pr-11 sm:pr-12 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl lg:rounded-2xl focus:border-primary-500 focus:from-primary-50 focus:to-white focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-300 text-gray-800 text-sm sm:text-base placeholder:text-gray-400 group-hover:border-primary-300"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-300" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-all duration-300 focus:outline-none p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button - Enhanced with food theme */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3.5 sm:py-4 lg:py-4.5 px-6 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-2xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 transition-all duration-300 flex items-center justify-center gap-3 text-sm sm:text-base lg:text-lg relative overflow-hidden group"
              >
                {/* Button shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">Logging in...</span>
                  </>
                ) : (
                  <>
                    <Utensils className="w-5 h-5 lg:w-6 lg:h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Start Your Meal Journey</span>
                  </>
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center pt-2">
                <button className="text-primary-600 hover:text-primary-700 font-semibold text-sm sm:text-base transition-all duration-300 hover:underline underline-offset-2 inline-flex items-center gap-1 group">
                  <Lock className="w-3.5 h-3.5 group-hover:animate-bounce" />
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200">
              <p className="text-center text-xs sm:text-sm text-gray-600 leading-relaxed">
                © {currentYear} <span className="font-semibold text-primary-600">MealHub</span>
              </p>
              <p className="text-center text-xs text-gray-500 mt-2">
                Bintang Toedjoe Catering Management System
              </p>
              <p className="text-center text-xs text-gray-400 mt-3 hidden sm:block">
                Made with ❤️ for delicious experiences
              </p>
            </div>
          </div>

          {/* Additional Info Badge - Desktop only */}
          <div className="hidden lg:flex mt-6 justify-center items-center gap-2 text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md mx-auto w-fit">
            <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" />
            <span>Your daily meal companion</span>
            <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>

    </>
  );
};

export default Login;