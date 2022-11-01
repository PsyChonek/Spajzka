import React from 'react';
import {Container} from "react-bootstrap";

function ItemHead_Spajz() {
    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-spajz">
                <div>Název</div>
                <div>Cena</div>
                <div>Detail</div>
                <div>Na skladě</div>
            </div>
        </Container>
    );
}

export default ItemHead_Spajz;