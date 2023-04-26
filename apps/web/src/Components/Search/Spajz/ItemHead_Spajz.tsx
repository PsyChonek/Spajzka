import React, { useEffect } from 'react';
import {Container, DropdownButton, ToggleButton} from "react-bootstrap";
import {SortOptionsItem} from "../SortOptions";
import ItemSeparator from "../ItemSeparator";

function ItemHead_Spajz(props: { sorts: SortOptionsItem[], updateSort: any }) {

    // Set default sort, isOnBuylist descending
    useEffect(() => {
        props.updateSort("name", true);
    }, [])

    return (
        <Container className="searchContainer">
            <div className="gridContainer-head-buylist">
                <DropdownButton title={"Seřadit"}>
                    <ToggleButton className="gridContainer-head-buylist-item" type="checkbox" value={"WHY"}
                                  checked={props.sorts?.find(x => x.value == "name")?.isActive}
                                  onClick={(e) => props.updateSort("name")}>
                        Název
                        {props.sorts?.find(x => x.value == "name")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon"></i>
                            || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                    </ToggleButton>
                    <ToggleButton className="gridContainer-head-buylist-item" type="checkbox" value={"WHY"}
                                  checked={props.sorts?.find(x => x.value == "price")?.isActive}
                                  onClick={(e) => props.updateSort("price")}>
                        Cena
                        {props.sorts?.find(x => x.value == "price")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon"></i>
                            || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                    </ToggleButton>
                    <ToggleButton className="gridContainer-head-buylist-item" type="checkbox" value={"WHY"}
                                  checked={props.sorts?.find(x => x.value == "inSpajz")?.isActive}
                                  onClick={(e) => props.updateSort("inSpajz")}>
                        Ve Špajzu?
                        {props.sorts?.find(x => x.value == "inSpajz")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon"></i>
                            || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                    </ToggleButton>
                </DropdownButton>
            </div>
            <ItemSeparator/>
            <div className="gridContainer-head-spajz">
                <div>Název</div>
                <div>Cena</div>
                <div>Detail</div>
                <div>Ve Špajzu</div>
            </div>
        </Container>
    );
}

export default ItemHead_Spajz;