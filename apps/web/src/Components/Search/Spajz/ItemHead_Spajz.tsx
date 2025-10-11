import React, { useEffect } from 'react';
import {SortOptionsItem} from "../SortOptions";
import ItemSeparator from "../ItemSeparator";
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

function ItemHead_Spajz(props: { sorts: SortOptionsItem[], updateSort: any }) {
    // Set default sort, isOnBuylist descending
    useEffect(() => {
        props.updateSort("name", true);
    }, [])

    const getSortIcon = (sortKey: string) => {
        const sort = props.sorts?.find(x => x.value === sortKey);
        return sort?.isDescending ? 'sort-down' : 'sort-up';
    };

    return (
        <div className="container searchContainer">
            <div className="gridContainer-head-buylist">
                <wa-dropdown>
                    <wa-button slot="trigger" with-caret variant="neutral">
                        Seřadit
                    </wa-button>
                    
                    <wa-dropdown-item
                        onClick={() => props.updateSort("name")}
                        type="button"
                        checked={props.sorts?.find(x => x.value === "name")?.isActive}
                    >
                        <wa-icon slot="start" name={getSortIcon("name")}></wa-icon>
                        Název
                    </wa-dropdown-item>
                    
                    <wa-dropdown-item
                        onClick={() => props.updateSort("price")}
                        type="button"
                        checked={props.sorts?.find(x => x.value === "price")?.isActive}
                    >
                        <wa-icon slot="start" name={getSortIcon("price")}></wa-icon>
                        Cena
                    </wa-dropdown-item>
                    
                    <wa-dropdown-item
                        onClick={() => props.updateSort("inSpajz")}
                        type="button"
                        checked={props.sorts?.find(x => x.value === "inSpajz")?.isActive}
                    >
                        <wa-icon slot="start" name={getSortIcon("inSpajz")}></wa-icon>
                        Ve Špajzu?
                    </wa-dropdown-item>
                </wa-dropdown>
            </div>
            <ItemSeparator/>
            <div className="gridContainer-head-spajz">
                <div>Název</div>
                <div>Cena</div>
                <div>Detail</div>
                <div>Ve Špajzu</div>
            </div>
        </div>
    );
}

export default ItemHead_Spajz;