import '../CSS/Global.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import { ItemService } from '../Other/itemService';

import { Item } from '../Api/Item';

function Apitest() {

    const getItems = async () => {
        const api = new Item();

       api.itemList().then((response) => {
            console.log(response);
        });
    }

    return (
        <Container className="content">
            <p className="text-center">API test</p>
            <Button variant="primary" onClick={() => {getItems()}}>Get Items</Button>
        </Container>
    );
}

export default Apitest;