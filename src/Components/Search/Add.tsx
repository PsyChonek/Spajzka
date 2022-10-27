import React, {useEffect, useState} from 'react';
import {Button, Container} from "react-bootstrap";
import PopUpWindow, {PopUpWindowState} from "../PopUpWindow";
import Input from "../Input";
import {Item, SaveItem} from "../../API/Items";


function SearchAdd(props: { callbackUpdate: any, query: string }) {
    const [popUpState, setPopUpState] = useState(PopUpWindowState.Hidden);
    const [value, setValue] = useState("");

    useEffect(() => {
        console.log(value)
    }, [value]);

    useEffect(() => {
        if (popUpState == PopUpWindowState.Accept && (value != "" || props.query != "")) {
            let newItem = new Item()
            newItem.name = value == "" ? props.query : value;
            SaveItem(newItem);
            setPopUpState(PopUpWindowState.Hidden)
            console.log("Accept")
            props.callbackUpdate();
        }
    }, [popUpState]);

    return (
        <Container>
            <Button onClick={() => setPopUpState(PopUpWindowState.WaitingAccept)} variant="primary">Přidat</Button>
            <PopUpWindow
                state={popUpState}
                setState={setPopUpState}
                title={"Přidat položku"}
                content={
                    <Input
                        title={"Název"}
                        type={"text"}
                        placeholder={"Název položky"}
                        callback={(value: string) => {
                            setValue(value)
                        }}
                        query={props.query}
                    />
                }
                buttonText={"Přidat"}
            />
        </Container>
    );
}

export default SearchAdd;