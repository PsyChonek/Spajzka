import '../CSS/Global.css'

import React, { FC, useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import SearchBar from '../Components/SearchBar';
import { debug } from 'console';
import { importIDB } from '../Other/indexDB';
import SearchItem from '../Components/SearchItem';


interface SourceItemsObject {
  Items: Array<SourceItem>
}

export interface SourceItem {
  name: string;
  price: number;
}

var jsonTestData = '{"Items":[{"id":"sd51asd","name":"jablko","price":25},{"id":"dsdasdasda","name":"hruška","price":35},{"id":"dasddds","name":"pomeranč","price":87},{"id":"xascass","name":"kokos","price":96}]}';

const Search = () => {
  const [allData, setAllData] = useState<SourceItem[]>([]);
  const [results, setResults] = useState<SourceItem[]>([]);

  // On page load, set all data
  useEffect(() => {
    loadAllResults();
  }, []) // Empty array means it only run once

  const loadAllResults = () => {
    var arr_from_json: SourceItemsObject = JSON.parse(jsonTestData);
    setAllData(arr_from_json.Items);
    setResults(allData);
  }

  const onSearchSubmit = (term: string) => {
    var termLower = term.toLowerCase();
    let results = Array<SourceItem>();

    if (term.length == 0) {
      setResults(allData);
      return;
    }

    for (let index = 0; index < allData.length; index++) {
      if (allData[index].name.includes(termLower)) {
        results.push(allData[index]);
      }
    }

    setResults(results)
  }

  const clearResults = () => setResults([]);

  const renderedResults = results.map((results, i) => {
    console.log(results)
    return <SearchItem item={results} key={i} />
  })

  return (
    <Container className='content'>
      <h1>Vyhledávaní</h1>
      <SearchBar onSearchSubmit={onSearchSubmit} />
      <Container>
        {renderedResults}
      </Container>
    </Container>
  );
}
export default Search;