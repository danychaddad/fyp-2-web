import React from "react";
import { Link } from "react-router-dom";
import logo from "./images/logo.png";

const Navbar = () => {
  return (
    <nav className="bg-red-600 flex items-center justify-between py-2 px-2">
      <div className="flex items-center">
        <Link to="/">
          <img src={logo} alt="Website Logo" className="h-8 w-8 mr-2" />
        </Link>
        <ul className="flex space-x-4"></ul>
      </div>
      <Link
        to="/create-forest"
        className="bg-white text-red-500 px-4 py-1 rounded-full mr-2"
      >
        Add Forest
      </Link>
    </nav>
  );
};

export default Navbar;
