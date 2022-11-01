import React, {useEffect, useState} from "react";
import {Button, Container, Form} from "react-bootstrap";
import {Item, SaveItem} from "../../API/Items";
import PopUpWindow, {PopUpWindowState} from "../PopUpWindow";
import ItemDetail from "./ItemDetail";


const ItemRow_BuyList = (props: { item: Item, updateCallback: any }) => {
    return (
        <div>
            <div className="gridContainer-item-buylist">
                <div><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
                <Form.Check type={"checkbox"}></Form.Check>
            </div>
        </div>
    );
}

export default ItemRow_BuyList;