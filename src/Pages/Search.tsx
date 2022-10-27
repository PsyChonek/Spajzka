import '../CSS/Global.css'

import React, {useEffect, useState} from 'react';
import Container from 'react-bootstrap/Container';
import SearchBar from '../Components/Search/Bar';
import SearchItem from '../Components/Search/Item';
import {GetItems, Item} from '../API/Items';
import SearchAdd from '../Components/Search/Add';
import SearchItemSeparator from '../Components/Search/ItemSeparator';
import SearchItemHead from '../Components/Search/ItemHead';
import SearchNavigation from '../Components/Search/Navigation';

const Search = () => {
    const [allData, setAllData] = useState<Item[]>([]);
    const [results, setResults] = useState<Item[]>([]);
    const [query, setQuery] = useState<string>('');

    // On page load, set all data
    useEffect(() => {
        updateAllData();
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

    const updateAllData = () => {
        GetItems().then((items:Item[]) => {
           console.log(items.length)
            setAllData(items);
        })
    }

    const updateResults = () => {
        var queryLower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let results = Array<Item>();

        if (query.length === 0) {
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
        return [
            <SearchItemSeparator/>,
            <SearchItem item={results} key={i}/>,
            <SearchItemSeparator/>
        ]
    })

    return (
        <Container className='content'>
            <h1>Vyhledávání</h1>
            <SearchBar onSearchSubmit={onSearchSubmit}/>
            <Container>
                <SearchItemHead/>
                {renderedResults}
                {renderedResults.length === 0 && <SearchAdd callbackUpdate={updateAllData} query={query}/>}
                {renderedResults.length >= 10 && <SearchNavigation/>}
            </Container>
        </Container>
    );
}
export default Search;