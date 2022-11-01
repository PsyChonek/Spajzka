import React, {useEffect, useState} from "react";
import {Button, Container, Form} from "react-bootstrap";
import {Item, SaveItem} from "../../../API/Items";

const ItemRow_BuyList = (props: { item: Item, updateCallback: any }) => {

    const UpdateItem = (isOnBuyList: boolean) => {
        props.item.isOnBuyList = isOnBuyList;
        SaveItem(props.item);
        props.updateCallback();
    }

    return (
        <div className="gridContainer-item-buylist" onClick={() => UpdateItem(!props.item.isOnBuyList)}>
            {props.item.isOnBuyList ? <></> : <div className="cross"></div>}
            <div><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
            {props.item.isOnBuyList ? <>✅</> : <>❌</>}
            {/*<Form.Check type={"checkbox"} checked={props.item.isOnBuyList}></Form.Check>*/}
        </div>
    );
}

export default ItemRow_BuyList;