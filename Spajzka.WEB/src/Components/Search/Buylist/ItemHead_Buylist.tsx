import React, {useEffect, useState} from 'react';
import {Button, ButtonGroup, Container, ToggleButton} from "react-bootstrap";
import {SortOptionsItem} from "../SortOptions";

function ItemHead_Buylist(props: { sorts: SortOptionsItem[], updateSort: any }) {
    
    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-buylist">
                <ToggleButton type="checkbox" checked={props.sorts?.find(x => x.value == "name")?.isActive}
                              variant="outline-primary" value="name" onChange={(e) => props.updateSort(e.currentTarget.value)}>
                    Název
                    &nbsp;&nbsp;
                    <i className="bi-sort-down"></i>
                </ToggleButton>
                <ToggleButton type="checkbox" checked={props.sorts?.find(x => x.value == "inSpajz")?.isActive} 
                              variant="outline-primary" value="inSpajz" onChange={(e) => props.updateSort(e.currentTarget.value)}> 
                    Je ve Špajzu?

                    &nbsp;&nbsp;
                    <i className="bi-sort-down"></i>
                </ToggleButton>
            </div>
        </Container>
    );
}

export default ItemHead_Buylist;