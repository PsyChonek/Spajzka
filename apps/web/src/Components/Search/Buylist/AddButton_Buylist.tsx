import React from "react";

const AddButton_Buylist = (SaveItem:any, query: string) => {
    return(
        <button onClick={() => SaveItem(true)} className="btn btn-primary">Přidat</button>
    )
}
export default AddButton_Buylist