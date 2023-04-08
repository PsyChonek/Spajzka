import React, {useEffect, useState} from "react";
import {Button, Container} from "react-bootstrap";
import PopUpWindow, {PopUpWindowState} from "../../PopUpWindow";
import ItemDetail from "../ItemDetail";
import {ItemModel} from "../../../Api";

const ItemRow_Spajz = (props: { item: ItemModel, updateCallback: any }) => {
    const [popUpState, setPopUpState] = useState(PopUpWindowState.Hidden);

    const UpdateItem = (isOnBuylist: boolean) => {
        props.item.isOnBuylist = isOnBuylist;
        // SaveItem(props.item);
        props.updateCallback();

    }

    const AddItem = (count: number) => {
        props.item.amount = Math.max((props.item.amount + count), 0);
        // SaveItem(props.item);
        props.updateCallback();
    }


    useEffect(() => {
        props.updateCallback();
    }, [popUpState]);

    return (
        <>
            <div className="gridContainer-item-spajz">
                <div><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
                <div>W.I.P.</div>
                {/*<Button variant="primary" onClick={() => setPopUpState(PopUpWindowState.WaitingOK)}>{props.item.price}</Button>*/}

                <Button variant="primary" onClick={() => setPopUpState(PopUpWindowState.WaitingOK)}>Detail</Button>
                <div className="amountButtonsContainer">
                    <Button className="amountButton" variant="danger" onClick={() => AddItem(-1)}>-</Button>
                    <b className="amountCount">{props.item.amount}</b>
                    <Button className="amountButton" variant="success" onClick={() => AddItem(1)}>+</Button>
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
        </>
    );
}

export default ItemRow_Spajz;