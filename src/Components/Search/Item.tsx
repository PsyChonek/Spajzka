import React, {FC, useEffect, useRef, useState} from "react";
import {Button, Container} from "react-bootstrap";
import {Item, SaveItem, SaveItems} from "../../API/Items";
import PopUpWindow from "../PopUpWindow";

const SearchItem = (props: { item: Item }) => {
    let newItem: Item = new Item(props.item);
    
    const [showDetail, setDetail] = useState(false);
    const [itemBuylist, changeItemBuylist] = useState(newItem.buylist);

    useEffect(() => {
        newItem.buylist = itemBuylist;
        SaveItem(newItem);
    }, [itemBuylist]);

    return (
        <Container>

            <div className="gridContainer">
                <div><b>{newItem.name.toLowerCase().charAt(0).toUpperCase() + newItem.name.slice(1).toLowerCase()}</b></div>
                <div>{newItem.price}</div>
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
                title={newItem.name.replace(/^./, newItem.name[0].toUpperCase())}
                content={`${newItem.name.replace(/^./, newItem.name[0].toUpperCase())} právě stojí ${newItem.price} Kč`}
            />

        </Container>
    );
}

export default SearchItem;