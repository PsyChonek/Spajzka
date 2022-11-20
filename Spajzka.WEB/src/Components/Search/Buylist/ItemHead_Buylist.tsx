import React from 'react';
import {Container} from "react-bootstrap";

function ItemHead_Buylist() {
    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-buylist">
                <div>Název</div>
                <div>Je ve Špajzu?</div>
            </div>
        </Container>
    );
}

export default ItemHead_Buylist;