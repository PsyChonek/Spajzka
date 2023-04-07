import React, {useEffect, useState} from "react";
import {Button, Container, Form} from "react-bootstrap";
import {Item} from "../../../Api/data-contracts";

var isHoolding: boolean = false;
var timer: any;

const ItemRow_Buylist = (props: { item: Item, updateCallback: any }) => {

    const UpdateItem = (isOnBuylist: boolean) => {
        props.item.isOnBuylist = isOnBuylist;
        // SaveItem(props.item);
        props.updateCallback();
    }

    const HoldItem = () => {
        console.log("Hold");
        
        UpdateItem(!props.item.isOnBuylist);
        isHoolding = true;

        timer = window.setTimeout(() => {
            if (isHoolding) {
                props.item.amount = 0;
                // SaveItem(props.item);
                props.updateCallback();
            }
        }, 1000);
    }

    return (
        <div className="gridContainer-item-buylist" onMouseDown={HoldItem} onMouseUp={() => {
            isHoolding = false;
            clearTimeout(timer);
        }}>
            {!props.item.isOnBuylist ? <div className="cross"></div> : <></>}
            <div className={props.item.isOnBuylist ? "" : "cross-text"}><b>{props.item.name.toLowerCase().charAt(0).toUpperCase() + props.item.name.slice(1).toLowerCase()}</b></div>
            {
                props.item.amount > 0 ?
                    <> <i className="bi bi-check-lg" style={{WebkitTextStrokeWidth: "0.8px", fontStyle: "normal"}}>
                    </i>
                        <div className={"gridContainer-item-buylist-count"}> ({props.item.amount})</div>
                    </> :
                    <><i className="bi bi-x-lg" style={{WebkitTextStrokeWidth: "0.8px", fontStyle: "normal"}}></i></>
            }
        </div>
    );
}

export default ItemRow_Buylist;