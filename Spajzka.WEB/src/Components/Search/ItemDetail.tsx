import React, {useEffect, useState} from "react";
import PopUpWindow, {PopUpWindowState} from "../PopUpWindow";
import Input from "../Input";
import {Button, Container} from "react-bootstrap";
import {DeleteItem, Item} from "../../Schema/Items";
import notificator from "../../Other/notificator";

const ItemDetail = (props: { item: Item, popUpState: any }) => {
    return (
        <Container>
            <Button variant="danger" onClick={() => {
                DeleteItem(props.item)
                notificator.notify(`Položka ${props.item.name} byla odebrána z spážky.`)
                props.popUpState(PopUpWindowState.OK)
            }}>Odebrat</Button>
        </Container>
    );
}

export default ItemDetail;