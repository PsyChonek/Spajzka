import '../CSS/Global.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import {Api} from "@psychonek/api-client"

function Apitest() {

    const getItems = async () => {
        const api = new Api();

        const items = await api.item.itemList().then((response) => {
            return response.data;
        });
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