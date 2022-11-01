import '../../CSS/Global.css'

import React, {useEffect, useState} from 'react';
import Container from 'react-bootstrap/Container';
import ItemSeparator from "./ItemSeparator";
import Bar from "./Bar";
import Navigation from "./Navigation";
import {GetItems, Item} from "../../API/Items";
import {scryRenderedComponentsWithType} from "react-dom/test-utils";
import Add from "./Add";
import ItemRow_Spajz from "./Spajz/ItemRow_Spajz";
import ItemRow_BuyList from "./BuyList/ItemRow_BuyList";
import ItemHead_Spajz from "./Spajz/ItemHead_Spajz";
import ItemHead_BuyList from "./BuyList/ItemHead_BuyList";

export enum SearchStyle {
    Spajz = 0,
    BuyList = 1,
}

const Search = (props: { type: SearchStyle }) => {

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
        GetItems().then((items: Item[]) => {
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

    const itemType = (result: Item) => {
        switch (props.type) {
            case SearchStyle.Spajz:
                return (<ItemRow_Spajz item={result} updateCallback={updateAllData}/>);
            case SearchStyle.BuyList:
                return (<ItemRow_BuyList item={result} updateCallback={updateAllData}></ItemRow_BuyList>);
        }
    }

    const headType = () => {
        switch (props.type) {
            case SearchStyle.Spajz:
                return (<ItemHead_Spajz/>);
            case SearchStyle.BuyList:
                return (<ItemHead_BuyList/>);
        }
    }
    const renderedResults = results.map((result, i) => {
        return [
            itemType(result),
        ]
    })

    return (
        <Container>
            <Bar onSearchSubmit={onSearchSubmit}/>
            <Container className="searchContainer">
                {renderedResults.length > 0 && headType()}
                <ItemSeparator/>
                {renderedResults}
                {renderedResults.length === 0 && <Add type={props.type} callbackUpdate={updateAllData} query={query}/>}
                {renderedResults.length >= 10 && <Navigation/>}
            </Container>
        </Container>
    );
}
export default Search;