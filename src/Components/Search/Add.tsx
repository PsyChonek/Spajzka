import React, {useState} from 'react';
import {Button, Container} from "react-bootstrap";
import PopUpWindow, {PopUpWindowState} from "../PopUpWindow";
import Input from "../Input";


function SearchAdd() {
    const [popUpState, setPopUpState] = useState(PopUpWindowState.Hidden);
    return (
        <Container>
            <Button onClick={() => setPopUpState(PopUpWindowState.WaitingResult)} variant="primary">Přidat</Button>

            <PopUpWindow
                state={popUpState}
                setState={setPopUpState}
                title={"Přidat položku"}
                content={<Input
                    title={"Název"}
                    type={"text"}
                    placeholder={"Okurka"}
                />}
                buttonText={"Přidat"}

            />
        </Container>


    );
}

export default SearchAdd;