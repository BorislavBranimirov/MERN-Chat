import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const SearchBar = (props) => {
  const [nameFilter, setNameFilter] = useState('');

  const handleChange = (event) => {
    setNameFilter(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const filteredChatRooms = await props.fetchFilteredRooms(nameFilter);
    props.setSidebarFilter({
      filtered: true,
      nameFilter,
      filteredChatRooms,
    });
  };

  const handleClear = () => {
    setNameFilter('');
    props.setSidebarFilter({
      filtered: false,
      nameFilter: '',
      filteredChatRooms: [],
    });
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="nameFilter"
          placeholder="Search..."
          value={nameFilter}
          onChange={handleChange}
        />
        <button type="submit">
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </form>
      <input
        className="cancel-search-btn"
        type="button"
        value="Clear search"
        onClick={handleClear}
      />
    </div>
  );
};

export default SearchBar;
