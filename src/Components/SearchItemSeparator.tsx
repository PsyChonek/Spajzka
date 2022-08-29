import React, { FC, useEffect, useState } from 'react';
import { Container } from "react-bootstrap";
import { Item } from "../API/Items";

function SearchItemSeparator() {
    return (
        <Container>
            <div className="gridContainer-separator">
            </div>
        </Container>
    );
}

export default SearchItemSeparator;