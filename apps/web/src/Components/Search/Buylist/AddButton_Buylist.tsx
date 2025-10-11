import React from "react";
import '@awesome.me/webawesome/dist/components/button/button.js';

const AddButton_Buylist = (SaveItem:any, query: string) => {
    return(
        <wa-button onClick={() => SaveItem(true)} variant="brand" appearance="filled">
            Přidat
        </wa-button>
    )
}
export default AddButton_Buylist