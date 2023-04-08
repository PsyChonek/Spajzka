import React, {useEffect, useState} from "react";
import PopUpWindow, {PopUpWindowState} from "../PopUpWindow";
import Input from "../Input";
import {Button, Container} from "react-bootstrap";
import notificator from "../../Other/notificator";
import {ItemModel} from "../../Api";
import {RemoveItem} from "../../Other/itemService";

const ItemDetail = (props: { item: ItemModel, popUpState: any }) => {
    return (
        <Container>
            <Button variant="danger" onClick={() => {
                RemoveItem(props.item)
                notificator.notify(`Položka ${props.item.name} byla odebrána z spážky.`)
                props.popUpState(PopUpWindowState.OK)
            }}>Odebrat</Button>
        </Container>
    );
}

export default ItemDetail;