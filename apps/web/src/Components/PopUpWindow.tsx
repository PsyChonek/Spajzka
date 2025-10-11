import '../CSS/Popup.css'
import React, {useEffect} from "react";

export enum PopUpWindowState {
    WaitingOK,
    OK,
    WaitingResult,
    Accept,
    Decline,
    WaitingAccept,
    Cancel,
    Hidden,
}


const PopUpWindow = (props: { state: PopUpWindowState, setState: any, title: string, content: any, buttonText: string }) => {
    const element = React.useRef<HTMLDivElement>(null);

    const close = (e: any) => {
        if (element?.current && !element?.current?.contains(e.target as Node)) {
            // console.log(e.target)
            // console.log(element.current)
            // props.setTrigger(false)
        }
    }

    useEffect(() => {
        document.body.addEventListener('click', close);
        return () => document.body.removeEventListener('click', close);
    });

    const popUpType = () => {
        switch (props.state) {
            case PopUpWindowState.WaitingOK:
                return (
                    <button onClick={() => props.setState(PopUpWindowState.OK)} className="btn btn-primary">{props.buttonText}</button>)
                break;
            case PopUpWindowState.WaitingResult:
                return (
                    <div className="popup-buttons">
                        <button onClick={() => props.setState(PopUpWindowState.Accept)} className="btn btn-success">Ano</button>
                        <button onClick={() => props.setState(PopUpWindowState.Decline)} className="btn btn-danger">Ne</button>
                    </div>)
                break;
            case PopUpWindowState.WaitingAccept:
                return (
                    <button onClick={() => props.setState(PopUpWindowState.Accept)} className="btn btn-success">{props.buttonText}</button>
                )
                break;
        }
    };


    return (props.state == PopUpWindowState.WaitingOK || props.state == PopUpWindowState.WaitingResult || props.state == PopUpWindowState.WaitingAccept) ? (
        <div ref={element} className="popup-container">
            <div className='popup-top'><h1>{props.title}</h1></div>
            <div className='popup-middle'>{props.content}</div>
            <div className='popup-bottom'>
                {popUpType()}
            </div>
        </div>
    ) : <></>;
}

export default PopUpWindow;