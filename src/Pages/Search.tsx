import '../CSS/Global.css'

import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import SearchBar from '../Components/SearchBar';
import SearchItem from '../Components/SearchItem';
import { GetItems, Item } from '../API/Items';
import { Console } from 'console';
import SearchAdd from '../Components/SearchAdd';

const Search = () => {
  const [allData, setAllData] = useState<Item[]>([]);
  const [results, setResults] = useState<Item[]>([]);
  const [query, setQuery] = useState<string>('');

  // On page load, set all data
  useEffect(() => {
    GetItems().then((items) => {
      setAllData(items);
    })
  }, []) // Empty array means it only run once

  // Update current result when new all data
  useEffect(() => {
    updateResults();
  }, [allData])

  // Query updated
  useEffect(() => {
    updateResults();
  }, [query])

  const onSearchSubmit = (term: string) => {
    setQuery(term);
  }

  const updateResults = () => {
    var queryLower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let results = Array<Item>();

    if (query.length == 0) {
      setResults(allData);
      return;
    }

    for (let index = 0; index < allData.length; index++) {
      if (allData[index].name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(queryLower)) {
        results.push(allData[index]);
      }
    }

    setResults(results)
  }

  const renderedResults = results.map((results, i) => {
    return <SearchItem item={results} key={i} />
  })


  return (
    <Container className='content'>
      <h1>Vyhledávaní</h1>
      <SearchBar onSearchSubmit={onSearchSubmit} />
      <Container>
        {renderedResults}
        {renderedResults.length == 0 && <SearchAdd/>}
      </Container>
    </Container>
  );
}
export default Search;