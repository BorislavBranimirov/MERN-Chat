import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SearchBar = (props) => {
    const [nameFilter, setNameFilter] = useState('');

    const handleChange = (event) => {
        setNameFilter(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        props.search(nameFilter);
    };

    const handleClear = (event) => {
        setNameFilter('');
        props.clearSearch();
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
                    <FontAwesomeIcon icon="search" />
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