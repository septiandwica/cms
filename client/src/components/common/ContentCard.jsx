import React from "react";

export const ContentCard = ({ children, className = "" }) => {
  return (
    <div className={`bg-white shadow-xl rounded-3xl p-6 md:p-8 border-2 border-primary-200 ${className}`}>
      {children}
    </div>
  );
};