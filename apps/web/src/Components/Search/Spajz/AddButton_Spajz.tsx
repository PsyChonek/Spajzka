import React from "react";
import PopUpWindow, {PopUpWindowState} from "../../PopUpWindow";
import Input from "../../Input";

const AddButton_Spajz = (popUpState:any, setPopUpState: any, setValue: any, query: string) =>
{

    return (
        <div>
            <button onClick={() => setPopUpState(PopUpWindowState.WaitingAccept)} className="btn btn-primary">Přidat</button>
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