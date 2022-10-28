import React, {useEffect, useState} from "react";
import PopUpWindow, {PopUpWindowState} from "../PopUpWindow";
import Input from "../Input";
import {Button, Container} from "react-bootstrap";
import {DeleteItem, Item} from "../../API/Items";

const ItemDetail = (props: { item: Item, popUpState: any }) => {
    return (
        <Container>
            <Button variant="danger" onClick={() => {
                DeleteItem(props.item)
                props.popUpState(PopUpWindowState.OK)
            }}>Odebrat</Button>
        </Container>
    );
}

export default ItemDetail;