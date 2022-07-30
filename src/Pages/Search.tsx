import '../CSS/Global.css'

import React, { FC } from 'react';
import Container from 'react-bootstrap/Container';
import SearchBar from '../Components/SearchBar';

const Search:FC<any> = () => {

  const onSearchSubmit: (term: any) => void = term => {
    console.log('New Search submit', term);
  }

  return (
    <Container className='content'>
      <h1>Vyhledávaní</h1>
      <SearchBar onSearchSubmit={(term: any) => onSearchSubmit(term)} />
    </Container>
  );
}
export default Search;