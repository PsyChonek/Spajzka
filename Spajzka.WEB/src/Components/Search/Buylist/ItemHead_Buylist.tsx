import React, {useState} from 'react';
import {Button, ButtonGroup, Container, ToggleButton} from "react-bootstrap";

function ItemHead_Buylist(props: { filters: string[], setFilters: any }) {

    const SetFilter = (filter: string) => {
        if (props.filters.includes(filter)) {
            props.setFilters([])
        } else {
            props.setFilters([filter])
        }
    }

    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-buylist">
                <ToggleButton id="toggle-check-name" type="checkbox" checked={props.filters.includes("name")} variant="primary" value="name" onChange={(e) => SetFilter(e.currentTarget.value)}> Název </ToggleButton>
                <ToggleButton id="toggle-check-inSpajz" type="checkbox" checked={props.filters.includes("inSpajz")} variant="primary" value="inSpajz" onChange={(e) => SetFilter(e.currentTarget.value)}> Je ve Špajzu? </ToggleButton>
            </div>
        </Container>
    );
}

export default ItemHead_Buylist;