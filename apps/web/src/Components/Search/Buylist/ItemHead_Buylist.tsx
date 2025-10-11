import React, {useEffect, useState} from 'react';
import {SortOptionsItem} from "../SortOptions";
import ItemSeparator from "../ItemSeparator";

function ItemHead_Buylist(props: { sorts: SortOptionsItem[], updateSort: any }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Set default sort, isOnBuylist descending
    useEffect(() => {
        props.updateSort("isOnBuylist", false);
    }, [])

    return (
        <div className="container searchContainer">
            <div className="gridContainer-head-buylist">
                <div className="dropdown">
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        aria-expanded={dropdownOpen}
                    >
                        Seřadit
                    </button>
                    <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                        <button
                            id="sort-isOnBuylist"
                            className={`gridContainer-head-buylist-item btn ${props.sorts?.find(x => x.value == "isOnBuylist")?.isActive ? 'active' : ''}`}
                            type="button"
                            onClick={(e) => props.updateSort("isOnBuylist")}
                        >
                            V nákupním seznamu?
                            {props.sorts?.find(x => x.value == "isOnBuylist")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon" ></i>
                                || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                        </button>
                        <button
                            id="sort-name"
                            className={`gridContainer-head-buylist-item btn ${props.sorts?.find(x => x.value == "name")?.isActive ? 'active' : ''}`}
                            type="button"
                            onClick={(e) => props.updateSort("name")}
                        >
                            Název
                            {props.sorts?.find(x => x.value == "name")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon"></i>
                                || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                        </button>
                        <button
                            id="sort-inSpajz"
                            className={`gridContainer-head-buylist-item btn ${props.sorts?.find(x => x.value == "inSpajz")?.isActive ? 'active' : ''}`}
                            type="button"
                            onClick={(e) => props.updateSort("inSpajz")}
                        >
                            Je ve Špajzu?
                            {props.sorts?.find(x => x.value == "inSpajz")?.isDescending && <i className="bi-sort-down gridContainer-head-item-icon"></i>
                                || <i className="bi-sort-up gridContainer-head-item-icon"></i>}
                        </button>
                    </div>
                </div>
            </div>
            <ItemSeparator/>
            <div className="gridContainer-head-spajz" style={{gridTemplateColumns: "50% 50%"}}>
                <div>Název</div>
                <div>Ve Špajzu</div>
            </div>
        </div>
    );
}

export default ItemHead_Buylist;