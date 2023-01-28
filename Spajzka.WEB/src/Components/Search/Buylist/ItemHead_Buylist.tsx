import React, {useEffect, useState} from 'react';
import {Button, ButtonGroup, Container, ToggleButton} from "react-bootstrap";
import {SortOptionsItem} from "../SortOptions";

function ItemHead_Buylist(props: { sorts: SortOptionsItem[], updateSort: any }) {

    const SetSort = (value: string) => {
        var sortIndex = props.sorts.findIndex((sort) => sort.value === value);
        
        var SortOption:SortOptionsItem = props.sorts[sortIndex];
        
        if (SortOption.isActive) {
            SortOption.isDescending = !SortOption.isDescending;
        }
        else {
            props.sorts.forEach((sort) => sort.isActive = false);
            SortOption.isActive = true;
            SortOption.isDescending = !SortOption.isDescending;
        }
        
        props.updateSort();
    };
    
    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-buylist">
                <ToggleButton id="toggle-check-name" type="checkbox" checked={props.sorts?.find(x => x.value == "name")?.isActive}
                              variant="primary" value="name" onChange={(e) => SetSort(e.currentTarget.value)}> Název </ToggleButton>
                <ToggleButton id="toggle-check-inSpajz" type="checkbox" checked={props.sorts?.find(x => x.value == "inSpajz")?.isActive} 
                              variant="primary" value="inSpajz" onChange={(e) => SetSort(e.currentTarget.value)}> Je ve Špajzu? </ToggleButton>
            </div>
        </Container>
    );
}

export default ItemHead_Buylist;