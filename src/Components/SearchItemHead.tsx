import { FC, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { Item } from "../API/Items";

function SearchItemHead() {
    return (
        <Container>
            <div className="gridContainer-head">
                <div>Název</div>
                <div>Cena</div>
                <div>Detail</div>
                <div>Nákupní lístek</div>
            </div>
        </Container>
    );
}

export default SearchItemHead;