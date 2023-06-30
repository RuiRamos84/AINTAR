import React, { useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import "./SearchBar.css";

const SearchBar = ({ onSearch }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef();

  const handleSearchClick = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      searchInputRef.current.focus();
    }
  };

  const handleSearchBlur = () => {
    if (searchInputRef.current.value === "") {
      setSearchOpen(false);
    }
  };

  const handleInputChange = (event) => {
    onSearch(event.target.value);
  };

  return (
    <div className={`search-bar ${searchOpen ? "open" : ""}`}>
      <input
        ref={searchInputRef}
        type="text"
        onBlur={handleSearchBlur}
        onChange={handleInputChange}
        placeholder="O que procura?"
        style={{
          opacity: searchOpen ? 1 : 0,
          transition: "opacity 0.3s, width 0.3s",
        }}
      />
      <button
        type="button"
        onClick={handleSearchClick}
        style={{
          opacity: searchOpen ? 0 : 1,
          transition: "opacity 0.3s",
        }}
      >
        <FaSearch />
      </button>
    </div>
  );
};

export default SearchBar;
