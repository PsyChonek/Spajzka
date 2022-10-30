import React, {useEffect, useState} from "react";
import {Button, Container} from "react-bootstrap";
import {Item, SaveItem} from "../../API/Items";
import PopUpWindow, {PopUpWindowState} from "../PopUpWindow";
import ItemDetail from "./ItemDetail";


const ItemRow = (props: { item: Item, updateCallback: any }) => {
    const [popUpState, setPopUpState] = useState(PopUpWindowState.Hidden);
    const [itemBuyAmount, setItemBuyAmount] = useState(props.item.amount || 0);

    useEffect(() => {
        props.item.amount = itemBuyAmount;
        SaveItem(props.item);
    }, [itemBuyAmount]);

    useEffect(() => {
        props.updateCallback();
    }, [popUpState]);

    return (
        <Container>
            <div className="gridContainer">
                <div><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
                <div>{props.item.price}</div>
                <Button variant="primary" onClick={() => setPopUpState(PopUpWindowState.WaitingOK)}>Detail</Button>
                <div className="amountButtonsContainer">
                    <Button className="amountButton" variant="danger" onClick={() => setItemBuyAmount(Math.max((itemBuyAmount - 1), 0))}>-</Button>
                    <b className="amountCount">{itemBuyAmount}</b>
                    <Button className="amountButton" variant="success" onClick={() => setItemBuyAmount(Math.max((itemBuyAmount + 1), 0))}>+</Button>
                </div>
            </div>

            <PopUpWindow
                state={popUpState}
                setState={setPopUpState}
                title={props.item.name.replace(/^./, props.item.name[0].toUpperCase())}
                content={
                    <ItemDetail item={props.item} popUpState={setPopUpState}/>
                }
                buttonText={"Jasně"}
            />

        </Container>
    );
}

export default ItemRow;