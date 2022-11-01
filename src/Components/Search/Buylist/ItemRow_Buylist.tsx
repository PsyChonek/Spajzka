import React, {useEffect, useState} from "react";
import {Button, Container, Form} from "react-bootstrap";
import {Item, SaveItem} from "../../../API/Items";

const ItemRow_Buylist = (props: { item: Item, updateCallback: any }) => {

    const UpdateItem = (isOnBuylist: boolean) => {
        props.item.isOnBuylist = isOnBuylist;
        SaveItem(props.item);
        props.updateCallback();
    }

    return (
        <div className="gridContainer-item-buylist" onClick={() => UpdateItem(!props.item.isOnBuylist)}>
            {props.item.isOnBuylist ? <></> : <div className="cross"></div>}
            <div><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
            {props.item.isOnBuylist ? <>✅</> : <>❌</>}
            {/*<Form.Check type={"checkbox"} checked={props.item.isOnBuylist}></Form.Check>*/}
        </div>
    );
}

export default ItemRow_Buylist;