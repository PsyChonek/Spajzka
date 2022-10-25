import React, {FC, useEffect, useRef, useState} from "react";
import {Button, Container} from "react-bootstrap";
import {Item, SaveItem, SaveItems} from "../../API/Items";
import PopUpWindow from "../PopUpWindow";


const SearchItem = (props: { item: Item }) => {
    const [showDetail, setDetail] = useState(false);
    const [itemBuyAmount, setItemBuyAmount] = useState(props.item.amount || 0);

    useEffect(() => {
        props.item.amount = itemBuyAmount;
        SaveItem(props.item);
    }, [itemBuyAmount]);

    return (
        <Container>

            <div className="gridContainer">
                <div><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
                <div>{props.item.price}</div>
                <Button variant="primary" onClick={() => setDetail(true)}>Detail</Button>
                <div className="amountButtonsContainer">
                    <Button className="amountButton" variant="danger" onClick={() => setItemBuyAmount(Math.max((itemBuyAmount - 1), 0))}>-</Button>
                    <b className="amountButton">{itemBuyAmount}</b>
                    <Button className="amountButton" variant="success" onClick={() => setItemBuyAmount(Math.max((itemBuyAmount + 1), 0))}>+</Button>
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