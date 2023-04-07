import '../CSS/Global.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import { GetItems } from '../Other/itemService';

import { Item } from '../Api/Item';

function Apitest() {
    const getItems = async () => {
        const items = await GetItems();
        console.log(items);
    }

    return (
        <Container className="content">
            <p className="text-center">API test</p>
            <Button variant="primary" onClick={() => {getItems()}}>Get Items</Button>
        </Container>
    );
}

export default Apitest;