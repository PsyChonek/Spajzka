import React, {useEffect, useState} from "react";
import {ItemModel} from "../../../Api";
import { UpdateUserItem } from "../../../Other/itemService";
import '@awesome.me/webawesome/dist/components/icon/icon.js';

var isHoolding: boolean = false;
var timer: any;

const ItemRow_Buylist = (props: { item: ItemModel, updateCallback: any }) => {

    const UpdateItem = (isOnBuylist: boolean) => {
        props.item.isOnBuylist = isOnBuylist;
        UpdateUserItem(props.item);
        props.updateCallback();
    }

    const HoldItem = () => {
        console.log("Hold");
        
        UpdateItem(!props.item.isOnBuylist);
        isHoolding = true;

        timer = window.setTimeout(() => {
            if (isHoolding) {
                props.item.amount = 0;
                UpdateUserItem(props.item); 
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
                    <> 
                        <wa-icon name="check" style={{ color: 'var(--success-color, #28a745)', fontSize: '1.2rem' } as React.CSSProperties}></wa-icon>
                        <div className={"gridContainer-item-buylist-count"}> ({props.item.amount})</div>
                    </> :
                    <wa-icon name="xmark" style={{ color: 'var(--danger-color, #dc3545)', fontSize: '1.2rem' } as React.CSSProperties}></wa-icon>
            }
        </div>
    );
}

export default ItemRow_Buylist;