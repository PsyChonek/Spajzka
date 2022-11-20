import React, {useEffect, useState} from "react";
import {Button, Container, Form} from "react-bootstrap";
import {Item, SaveItem} from "../../../API/Items";

const ItemRow_Buylist = (props: { item: Item, updateCallback: any }) => {

    const UpdateItem = (isOnBuylist: boolean) => {
        props.item.isOnBuylist = isOnBuylist;
        SaveItem(props.item);
        props.updateCallback();
    }
    
    const getRandomRotation = () => {
        return Math.floor(Math.random() * 360);
    }

    return (
        <div className="gridContainer-item-buylist" onClick={() => UpdateItem(!props.item.isOnBuylist)}>
            {!props.item.isOnBuylist ? <div className="cross"></div> : <></>}
            <div className={props.item.isOnBuylist ? "" : "cross-text"}><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
            {props.item.isOnBuylist ? <>✅</> : <>❌</>}
        </div>
    );
}

export default ItemRow_Buylist;