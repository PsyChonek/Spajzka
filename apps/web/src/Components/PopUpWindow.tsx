import '../CSS/Popup.css'
import React, {useEffect} from "react";
import '@awesome.me/webawesome/dist/components/button/button.js';

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
                    <wa-button onClick={() => props.setState(PopUpWindowState.OK)} variant="brand" appearance="filled">
                        {props.buttonText}
                    </wa-button>
                )
                break;
            case PopUpWindowState.WaitingResult:
                return (
                    <div className="popup-buttons">
                        <wa-button onClick={() => props.setState(PopUpWindowState.Accept)} variant="success" appearance="filled">
                            Ano
                        </wa-button>
                        <wa-button onClick={() => props.setState(PopUpWindowState.Decline)} variant="danger" appearance="filled">
                            Ne
                        </wa-button>
                    </div>
                )
                break;
            case PopUpWindowState.WaitingAccept:
                return (
                    <wa-button onClick={() => props.setState(PopUpWindowState.Accept)} variant="success" appearance="filled">
                        {props.buttonText}
                    </wa-button>
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