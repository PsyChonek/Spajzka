import '../CSS/Popup.css'
import {Button, Col, Container, Row} from "react-bootstrap";
import React, {FC, useEffect, useRef, useState} from "react";

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
                    <Button onClick={() => props.setState(PopUpWindowState.OK)} variant="primary">{props.buttonText}</Button>)
                break;
            case PopUpWindowState.WaitingResult:
                return (
                    <Row>
                        <Col>
                            <Button onClick={() => props.setState(PopUpWindowState.Accept)} variant="success">Ano</Button>
                        </Col>
                        <Col>
                            <Button onClick={() => props.setState(PopUpWindowState.Decline)} variant="danger">Ne</Button>
                        </Col>
                    </Row>)
                break;
            case PopUpWindowState.WaitingAccept:
                return (
                    <Button onClick={() => props.setState(PopUpWindowState.Accept)} variant="success">{props.buttonText}</Button>
                )
                break;
        }
    };


    return (props.state == PopUpWindowState.WaitingOK || props.state == PopUpWindowState.WaitingResult || props.state == PopUpWindowState.WaitingAccept) ? (
        <Container ref={element} className="popup-container">
            <div className='popup-top'><h1>{props.title}</h1></div>
            <div className='popup-middle'>{props.content}</div>
            <div className='popup-bottom'>
                {popUpType()}
            </div>
        </Container>
    ) : <></>;
}

export default PopUpWindow;