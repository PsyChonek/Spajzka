import React from "react";
import PopUpWindow, {PopUpWindowState} from "../../PopUpWindow";
import Input from "../../Input";
import '@awesome.me/webawesome/dist/components/button/button.js';

const AddButton_Spajz = (popUpState:any, setPopUpState: any, setValue: any, query: string) =>
{

    return (
        <div>
            <wa-button onClick={() => setPopUpState(PopUpWindowState.WaitingAccept)} variant="brand" appearance="filled">
                Přidat
            </wa-button>
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
        </div>
    )
}
export default AddButton_Spajz;