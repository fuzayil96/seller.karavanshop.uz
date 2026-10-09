import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-[#02130e]">
        <div className="text-xl text-gray-500 dark:text-gray-400">Yuklanmoqda...</div>
      </div>
    );
  }

  // If no user is logged in (e.g. testing in browser without mock login)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not in the allowed roles list, redirect or show unauthorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect seller to their allowed page instead of a dead end
    if (user.role === 'seller') {
      return <Navigate to="/sellers" replace />;
    }

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-[#02130e] p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Kirish taqiqlangan!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sizda ushbu sahifaga kirish huquqi yo'q. Sizning rolingiz: <span className="font-semibold text-gray-800 dark:text-gray-200">{user.role}</span>
        </p>
        {user.role === 'pending' && (
          <p className="text-gray-500 mt-4 text-sm">Admindan sizga rol berishini kuting.</p>
        )}
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
