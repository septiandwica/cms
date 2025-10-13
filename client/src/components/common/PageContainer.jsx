import React from "react";

export const PageContainer = ({ children, withNav = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 font-poppins pb-20">
        {children}
    </div>
  );
};