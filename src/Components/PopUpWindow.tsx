import '../CSS/Popup.css'
import {Button, Col, Container, Row} from "react-bootstrap";
import React, {FC, useEffect, useRef, useState} from "react";

export enum PopUpWindowState {
    WaitingOK,
    OK,
    WaitingResult,
    Accept,
    Decline,
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

    switchTest()
    {
        switch (props.state) {
            case PopUpWindowState.WaitingOK:
                return (
                    <Button onClick={() => props.setState(PopUpWindowState.OK)} variant="primary">{props.buttonText}</Button>)
                break;
            case PopUpWindowState.WaitingResult:
                return (
                    <Row>
                        <Col>
                            <Button onClick={() => props.setState(PopUpWindowState.Accept)} variant="success">Přidat</Button>
                        </Col>
                        <Col>
                            <Button onClick={() => props.setState(PopUpWindowState.Decline)} variant="danger">Zrušit</Button>
                        </Col>
                    </Row>)
                break;

        }
    }

    return (props.state == PopUpWindowState.WaitingOK || props.state == PopUpWindowState.WaitingResult) ? (
        <Container ref={element} className="popup-container">
            <div className='popup-top'><h1>{props.title}</h1></div>
            <div className='popup-middle'>{props.content}</div>
            <div className='popup-bottom'>

            </div>
        </Container>
    ) : <></>;
}

export default PopUpWindow;