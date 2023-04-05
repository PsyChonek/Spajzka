import '../CSS/Global.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import {Item} from "@psychonek/api-client"

function Apitest() {

    //Call api get items
    const getItems = async () => {
        const client = new Item();
        // client.itemList().then((response) => {
        //     console.log(response);
        // });
    }

    return (
        <Container className="content">
            <p className="text-center">API test</p>
            <Button variant="primary" onClick={() => {getItems()}}>Primary</Button>
        </Container>
    );
}

export default Apitest;