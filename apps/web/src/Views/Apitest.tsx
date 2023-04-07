import '../CSS/Global.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import { GetItems } from '../Other/itemService';
import { Item } from '../Api/Item';

function Apitest() {

    const [items, setItems] = React.useState<Item[]>([]);

    return (
        <Container className="content">
            <p className="text-center">API test</p>
            <Button variant="primary" onClick={() => {
                GetItems().then((result) => {
                    setItems(result as unknown as Item[]);
                });
            }}>Get Items</Button>

            {
                items.length > 0 ? items.map((item) => {
                    return (
                        <p>Something</p>
                    )
                }) : <p>Nothing</p>
            }
        </Container>
    );
}

export default Apitest;