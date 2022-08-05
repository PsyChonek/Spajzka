import '../CSS/Search.css'

import React, { FC, useEffect, useState } from 'react';

const SearchBar = (props: { onSearchSubmit: Function }) => {
    const [term, setTerm] = useState('');

    useEffect(() => {
        props.onSearchSubmit(term);
    }, [term]);

    return (
        <div className='searchbar'>
            <input
                className='searchbar-input'
                type='text'
                placeholder="Vyhledej podle názvu. . ."
                onChange={e => setTerm(e.target.value)}
                value={term} />
        </div>
    );
};

export default SearchBar;