import React, {useEffect, useState} from "react";
import PopUpWindow, {PopUpWindowState} from "../../PopUpWindow";
import ItemDetail from "../ItemDetail";
import {ItemModel} from "../../../Api";
import { UpdateUserItem } from "../../../Other/itemService";
import '@awesome.me/webawesome/dist/components/button/button.js';

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

                <wa-button variant="brand" size="small" onClick={() => setPopUpState(PopUpWindowState.WaitingOK)}>
                    Detail
                </wa-button>
                <div className="amountButtonsContainer">
                    <wa-button className="amountButton" variant="danger" size="small" onClick={() => AddItem(-1)}>
                        -
                    </wa-button>
                    <b className="amountCount">{props.item.amount}</b>
                    <wa-button className="amountButton" variant="success" size="small" onClick={() => AddItem(1)}>
                        +
                    </wa-button>
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