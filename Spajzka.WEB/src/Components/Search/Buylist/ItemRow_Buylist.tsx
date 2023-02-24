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
            {
                props.item.amount > 0 ?
                    <> <i className="bi bi-check-lg" style={{WebkitTextStrokeWidth: "0.8px", fontStyle: "normal"}}>
                        ({props.item.amount})</i></> :
                    <><i className="bi bi-x-lg" style={{WebkitTextStrokeWidth: "0.8px", fontStyle: "normal"}}></i></>
            }
        </div>
    );
}

export default ItemRow_Buylist;