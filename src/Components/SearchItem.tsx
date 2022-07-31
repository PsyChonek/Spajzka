import { FC, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { SourceItem } from "../Pages/Search";

const SearchItem = (props: {item:SourceItem}) => {
    return (
        <Container>
            <h1>{props.item.name}</h1>
        </Container>
    );
}

export default SearchItem;