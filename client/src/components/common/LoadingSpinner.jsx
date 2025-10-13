import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({
  size = "w-16 h-16", // default lebih besar
  fullScreen = true,
  text = "Loading...",
}) => {
  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
        <Loader2 className={`${size} animate-spin text-primary-600 mb-4`} />
        {text && <p className="text-primary-700 font-medium text-lg">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <Loader2 className={`${size} animate-spin text-primary-600 mb-2`} />
      {text && <p className="text-primary-700 font-medium">{text}</p>}
    </div>
  );
};
