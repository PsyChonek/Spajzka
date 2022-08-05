import { FC, useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { Item } from "../API/Items";

const SearchItem = (props: { item: Item }) => {
    return (
        <Container>
            <div className="gridContainer">
                <div>{props.item.name}</div>
                <div>{props.item.price}</div>
                <Button variant="primary">Detail</Button>
                <div>+ 0 -</div>
            </div>
        </Container>
    );
}

export default SearchItem;