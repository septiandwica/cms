import React from "react";
import SideMenu from "./SideMenu";
import { useState } from "react";
import { X, Menu } from "lucide-react";

export const Navbar = ({activeMenu}) => {
    const [openSideMenu, setOpenSideMenu ] =useState(false);
    
  return (
    <div className="flex gap-5 bg-white border border-b border-gray-200/50 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-30">
      <button
        className="block lg:hidden text-black"
        onClick={() => {
          setOpenSideMenu(!openSideMenu);
        }}
      >
        {openSideMenu ? (
          <X className="text-2xl" />
        ) : (
          <Menu className="text-2xl" />
        )}
      </button>
      <h2 className="text-lg font-medium text-black">MealHub</h2>
      {openSideMenu&&(
        <div className="fixed top-[61px] left-0 bg-white">
            <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </div>
  );
};