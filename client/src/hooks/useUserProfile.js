import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useUserProfile = () => {
  const { user, loading: userLoading } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    thisMonth: 0
  });

  // You can fetch real stats here if you have an API endpoint
  // For now using placeholder data
  useEffect(() => {
    // Simulate fetching stats
    setStats({
      totalOrders: 24,
      pendingOrders: 3,
      completedOrders: 21,
      thisMonth: 8
    });
  }, [user]);

  return { user, stats, loading: userLoading };
};