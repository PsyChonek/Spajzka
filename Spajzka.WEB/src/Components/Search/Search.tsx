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
import ItemRow_Buylist from "./Buylist/ItemRow_Buylist";
import ItemHead_Spajz from "./Spajz/ItemHead_Spajz";
import ItemHead_Buylist from "./Buylist/ItemHead_Buylist";
import {ALL} from "dns";
import {SortOptionsItem} from "./SortOptions";

export enum SearchStyle {
    Spajz = 0,
    Buylist = 1,
}

const Search = (props: { type: SearchStyle }) => {
    const [allData, setAllData] = useState<Item[]>([]);
    const [results, setResults] = useState<Item[]>([]);
    const [query, setQuery] = useState<string>('');
    const [sorts, setSorts] = useState<SortOptionsItem[]>([new SortOptionsItem("name", true), new SortOptionsItem("inSpajz"),
        new SortOptionsItem("isOnBuylist")]);

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

    // Sort updated
    const updateSort = (key: string) => {
        var sortIndex = sorts.findIndex((sort) => sort.value === key);
        var SortOption: SortOptionsItem = sorts[sortIndex];

        if (SortOption.isActive) {
            SortOption.isDescending = !SortOption.isDescending;
        } else {
            sorts.forEach((sort) => sort.isActive = false);
            SortOption.isActive = true;
            SortOption.isDescending = !SortOption.isDescending;
        }

        updateResults();
    }

    // Result updated
    // useEffect(() => {   
    //     console.log("Results updated");
    // }, [results])

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
        let results = new Array<Item>();

        setResults(results)

        if (query.length > 0) {
            for (let index = 0; index < allData.length; index++) {
                if (allData[index].name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(queryLower)) {
                    results.push(allData[index]);
                }
            }
        } else {
            results = [...allData];
        }

        if (sorts.find(x => x.value == "inSpajz")?.isActive) {
            results.sort((a, b) => {
                if (sorts.find(x => x.value == "inSpajz")?.isDescending) {
                    return b.amount - a.amount;
                } else {
                    return a.amount - b.amount;
                }
            })
        }

        if (sorts.find(x => x.value == "name")?.isActive) {
            results.sort((a, b) => {
                if (sorts.find(x => x.value == "name")?.isDescending) {
                    return a.name.localeCompare(b.name);
                } else {
                    return b.name.localeCompare(a.name);
                }
            })
        }

        if (sorts.find(x => x.value == "isOnBuylist")?.isActive) {
            results.sort((a, b) => {
                if (sorts.find(x => x.value == "isOnBuylist")?.isDescending) {
                    return a.isOnBuylist ? 1 : -1
                } else {
                    return a.isOnBuylist ? -1 : 1
                }
            });
        }
        
        setResults(results)
    }

    const itemType = (result: Item) => {
        switch (props.type) {
            case SearchStyle.Spajz:
                return (<ItemRow_Spajz item={result} updateCallback={updateAllData}/>);
            case SearchStyle.Buylist:
                return (<ItemRow_Buylist item={result} updateCallback={updateAllData}></ItemRow_Buylist>);
        }
    }

    const headType = () => {
        switch (props.type) {
            case SearchStyle.Spajz:
                return (<ItemHead_Spajz/>);
            case SearchStyle.Buylist:
                return (<ItemHead_Buylist sorts={sorts} updateSort={updateSort}/>);
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
                {renderedResults.length >= 15 && <Navigation/>}
            </Container>
        </Container>
    );
}
export default Search;