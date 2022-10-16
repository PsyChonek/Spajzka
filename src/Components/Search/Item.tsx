import React, {FC, useEffect, useRef, useState} from "react";
import {Button, Container} from "react-bootstrap";
import {Item, SaveItem, SaveItems} from "../../API/Items";
import PopUpWindow from "../PopUpWindow";

const SearchItem = (props: { item: Item }) => {
    const [showDetail, setDetail] = useState(false);
    const [itemBuylist, changeItemBuylist] = useState(props.item.buylist);

    useEffect(() => {
        props.item.buylist = itemBuylist;
        SaveItem(props.item);
    }, [itemBuylist]);

    return (
        <Container>

            <div className="gridContainer">
                <div><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
                <div>{props.item.price}</div>
                <Button variant="primary" onClick={() => setDetail(true)}>Detail</Button>
                <div>
                    <Button variant="danger" onClick={() => changeItemBuylist(itemBuylist - 1)}>-</Button>
                    <b>{itemBuylist}</b>
                    <Button variant="success" onClick={() => changeItemBuylist(itemBuylist + 1)}>+</Button>
                </div>
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