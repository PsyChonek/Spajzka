import React, {useState} from "react";

enum SortOptionsType {
    Add,
    Select
}

export class SortOptionsItem {
    constructor(value: string, isActive: boolean = false, isDescending: boolean = false) {
        this.value = value;
        this.isActive = isActive;
        this.isDescending = isActive;
    }

    value: string = "";
    isDescending: boolean = false;
    isActive: boolean = false;
}

const SortOptions = (props: { sorts: SortOptionsItem[], SortOptionType: SortOptionsType }) => {
    const [filters, setFilters] = useState([""]);

    return (
        <>
        </>
    )
}

export default SortOptions