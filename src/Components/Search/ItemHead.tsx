import React from 'react';
import {Container} from "react-bootstrap";

function SearchItemHead() {
    return (
        <Container>
            <div className="gridContainer-head">
                <div>Název</div>
                <div>Cena</div>
                <div>Detail</div>
                <div>Na skladě</div>
            </div>
        </Container>
    );
}

export default SearchItemHead;