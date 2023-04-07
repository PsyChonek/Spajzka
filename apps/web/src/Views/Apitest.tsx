import '../CSS/Global.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import { GetItems } from '../Other/itemService';
import { ItemModel } from '../Api/data-contracts';

function Apitest() {
    const [items, setItems] = React.useState<ItemModel[]>([]);

    return (
        <Container className="content">
            <p className="text-center">API test</p>
            <Button variant="primary" onClick={() => {
                GetItems().then((result) => {
                    setItems(result);
                });
            }}>Get Items</Button>

            {
                items.length > 0 ? items.map((item: ItemModel) => {
                    return (
                        <p>{item.name}</p>
                    )
                }) : <p>Nothing</p>
            }
        </Container>
    );
}

export default Apitest;