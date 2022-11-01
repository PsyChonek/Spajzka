import {Button, Container} from "react-bootstrap";
import React from "react";
import PopUpWindow, {PopUpWindowState} from "../../PopUpWindow";
import Input from "../../Input";

const AddButton_Spajz = (popUpState:any, setPopUpState: any, setValue: any, query: string) =>
{

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
                        query={query}
                    />
                }
                buttonText={"Přidat"}
            />
        </Container>
    )
}
export default AddButton_Spajz;