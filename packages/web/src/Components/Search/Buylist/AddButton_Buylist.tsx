import React from "react";
import {Button} from "react-bootstrap";

const AddButton_Buylist = (SaveItem:any, query: string) => {
    return(
        <Button onClick={() => SaveItem(true)} variant="primary">Přidat</Button>
    )
}
export default AddButton_Buylist