import '../CSS/SearchBar.css'

import React, { FC, useEffect, useState } from 'react';
import Search from "../Pages/Search"

const SearchBar:FC<any> = ({onSearchSubmit}) => {
    const [term, setTerm] = useState('');

    useEffect(() => {
        if (term !== '') {
            onSearchSubmit(term);
        }
    }, [term, onSearchSubmit]);

    return (
        <div className='searchbar'>
            <input
                className='searchbar-input'
                type='text'
                placeholder="Search user by name. . ."
                onChange={e => setTerm(e.target.value)}
                value={term} />
        </div>
    );
};


export default SearchBar;