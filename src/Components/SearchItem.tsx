import React, { FC, useEffect, useRef, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { Item } from "../API/Items";
import PopUpWindow from "./PopUpWindow";

const SearchItem = (props: { item: Item }) => {
    const [showDetail, setDetail] = useState(false);

    return (
        <Container>

            <div className="gridContainer">
                <div>{props.item.name}</div>
                <div>{props.item.price}</div>
                <Button variant="primary" onClick={() => setDetail(true)}>Detail</Button>
                <div>+ 0 -</div>
            </div>

            <PopUpWindow
                trigger={showDetail}
                setTrigger={setDetail}
                title={props.item.name.replace(/^./, props.item.name[0].toUpperCase())}
                content={`${props.item.name.replace(/^./, props.item.name[0].toUpperCase())} právě stojí ${props.item.price} Kč`}
            />

        </Container>
    );
}

export default SearchItem;