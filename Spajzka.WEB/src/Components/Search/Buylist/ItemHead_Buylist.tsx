import React, {useState} from 'react';
import {Button, ButtonGroup, Container, ToggleButton} from "react-bootstrap";

function ItemHead_Buylist() {
    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-buylist">
                <ToggleButton id="toggle-check-name" type="checkbox" checked={filters.includes("name")} variant="primary" value="name" onChange={(e) => SelectFilterOption(e.currentTarget.value)}> Název </ToggleButton>
                <ToggleButton id="toggle-check-inSpajz" type="checkbox" checked={filters.includes("inSpajz")} variant="primary" value="inSpajz" onChange={(e) => SelectFilterOption(e.currentTarget.value)}> Je ve Špajzu? </ToggleButton>
            </div>
        </Container>
    );
}

export default ItemHead_Buylist;