import React from "react";
import {PopUpWindowState} from "../PopUpWindow";
import notificator from "../../Other/notificator";
import {ItemModel} from "../../Api";
import {RemoveItem} from "../../Other/itemService";
import '@awesome.me/webawesome/dist/components/button/button.js';

const ItemDetail = (props: { item: ItemModel, popUpState: any }) => {
    return (
        <div>
            <wa-button variant="danger" onClick={() => {
                if (props.item.id) {
                    RemoveItem(props.item.id)
                    notificator.notify(`Položka ${props.item.name} byla odebrána z spážky.`)
                    props.popUpState(PopUpWindowState.OK)
                }
            }}>
                Odebrat
            </wa-button>
        </div>
    );
}

export default ItemDetail;