import React, {useEffect, useState} from 'react';
import {Button, ButtonGroup, Container, ToggleButton} from "react-bootstrap";
import {SortOptionsItem} from "../SortOptions";

function ItemHead_Buylist(props: { sorts: SortOptionsItem[], updateSort: any }) {

    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-buylist">
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
            </div>
        </Container>
    );
}

export default ItemHead_Buylist;