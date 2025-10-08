import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import { API_PATHS } from "../services/apiPaths";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // ================== FETCH FUNCTIONS ==================
  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ROLES.GET_ALL);
      setRoles(response.data.roles || response.data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.DEPARTMENTS.GET_ALL);
      setDepartments(response.data.departments || response.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedRole && { role_id: selectedRole }),
        ...(selectedDepartment && { department_id: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus }),
      };

      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL, {
        params,
      });
      const data = response.data;

      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // ================== CRUD FUNCTIONS ==================
  const createUser = async (formData) => {
    try {
      const response = await axiosInstance.post(API_PATHS.USERS.CREATE, formData);
      await fetchUsers();
      return response.data;
    } catch (err) {
      setError(err?.message || "Failed to create user");
      throw err;
    }
  };

  const updateUser = async (id, formData) => {
    try {
      const updateData = { ...formData };
      delete updateData.password; // don’t send password in update
      const response = await axiosInstance.put(API_PATHS.USERS.UPDATE(id), updateData);
      await fetchUsers();
      return response.data;
    } catch (err) {
      setError(err?.message || "Failed to update user");
      throw err;
    }
  };

  const deleteUser = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.USERS.DELETE(id));
      await fetchUsers();
    } catch (err) {
      setError(err?.message || "Failed to delete user");
      throw err;
    }
  };

  // ================== INIT ==================
  useEffect(() => {
    fetchRoles();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, selectedRole, selectedDepartment, selectedStatus]);

  return (
    <UserContext.Provider
      value={{
        users,
        roles,
        departments,
        loading,
        error,
        currentPage,
        totalPages,
        totalUsers,
        limit,
        searchQuery,
        selectedRole,
        selectedDepartment,
        selectedStatus,
        setCurrentPage,
        setSearchQuery,
        setSelectedRole,
        setSelectedDepartment,
        setSelectedStatus,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
