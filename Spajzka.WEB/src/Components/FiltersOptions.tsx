import React, {useState} from "react";

enum FilterOptionsType {
    Add,
    Select
}

const FiltersOptions = (props: { filters: string[], FiltersOptionType: FilterOptionsType }) => {
    const [filters, setFilters] = useState([""]);

    const AddFilterOption = (filter: string) => {
        if (filters.includes(filter)) {
            setFilters(filters.filter(f => f != filter))
        } else {
            setFilters([...filters, filter])
        }
    }

    const SelectFilterOption = (filter: string) => {
        if (filters.includes(filter)) {
            setFilters([])
        } else {
            setFilters([filter])
        }
    }
    
    return (
        <>
        </>
    )
}

export default FiltersOptions