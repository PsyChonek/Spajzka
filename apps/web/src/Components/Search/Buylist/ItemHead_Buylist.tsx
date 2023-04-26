import React, {useEffect, useState} from 'react';
import {Button, ButtonGroup, Container, DropdownButton, ToggleButton} from "react-bootstrap";
import {SortOptionsItem} from "../SortOptions";
import ItemSeparator from "../ItemSeparator";

function ItemHead_Buylist(props: { sorts: SortOptionsItem[], updateSort: any }) {

    // Set default sort, isOnBuylist descending
    useEffect(() => {
        props.updateSort("isOnBuylist", false);
    }, [])

    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-buylist">
                <DropdownButton title={"Seřadit"}>
                    <ToggleButton className="gridContainer-head-buylist-item" type="checkbox" value={"WHY"}
                                  checked={props.sorts?.find(x => x.value == "isOnBuylist")?.isActive}
                                  onClick={(e) => props.updateSort("isOnBuylist")}>
                        V nákupním seznamu?
                        {props.sorts?.find(x => x.value == "isOnBuylist")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon" ></i>
                            || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                    </ToggleButton>
                    <ToggleButton className="gridContainer-head-buylist-item" type="checkbox" value={"WHY"}
                                  checked={props.sorts?.find(x => x.value == "name")?.isActive}
                                  onClick={(e) => props.updateSort("name")}>
                        Název
                        {props.sorts?.find(x => x.value == "name")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon"></i>
                            || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                    </ToggleButton>
                    <ToggleButton className="gridContainer-head-buylist-item" type="checkbox" value={"WHY"}
                                  checked={props.sorts?.find(x => x.value == "inSpajz")?.isActive}
                                  onClick={(e) => props.updateSort("inSpajz")}>
                        Je ve Špajzu?
                        {props.sorts?.find(x => x.value == "inSpajz")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon"></i>
                            || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                    </ToggleButton>
                </DropdownButton>
            </div>
            <ItemSeparator/>
            <div className="gridContainer-head-spajz" style={{gridTemplateColumns: "50% 50%"}}>
                <div>Název</div>
                <div>Ve Špajzu</div>
            </div>
        </Container>
    );
}

export default ItemHead_Buylist;