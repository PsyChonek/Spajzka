import React, {useEffect, useState} from "react";
import PopUpWindow, {PopUpWindowState} from "../../PopUpWindow";
import ItemDetail from "../ItemDetail";
import {ItemModel} from "../../../Api";
import { UpdateUserItem } from "../../../Other/itemService";

const ItemRow_Spajz = (props: { item: ItemModel, updateCallback: any }) => {
    const [popUpState, setPopUpState] = useState(PopUpWindowState.Hidden);

    const AddItem = (count: number) => {
        props.item.amount = Math.max((props.item.amount + count), 0);
        UpdateUserItem(props.item);
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

                <button className="btn btn-primary" onClick={() => setPopUpState(PopUpWindowState.WaitingOK)}>Detail</button>
                <div className="amountButtonsContainer">
                    <button className="amountButton btn btn-danger" onClick={() => AddItem(-1)}>-</button>
                    <b className="amountCount">{props.item.amount}</b>
                    <button className="amountButton btn btn-success" onClick={() => AddItem(1)}>+</button>
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