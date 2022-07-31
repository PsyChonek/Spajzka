import { FC, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { Item } from "../API/Items";

const SearchItem = (props: {item:Item}) => {
    return (
        <Container>
            <h1>{props.item.name}</h1>
        </Container>
    );
}

export default SearchItem;