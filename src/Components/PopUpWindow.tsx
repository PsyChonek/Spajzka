import '../CSS/Popup.css'
import { Button, Col, Container, Row } from "react-bootstrap";
import React, { FC, useEffect, useRef, useState } from "react";

const PopUpWindow = (props: { trigger: any, setTrigger: any, title: string, content: string }) => {
    const element = React.useRef<HTMLDivElement>(null);
    
    const close = (e: any) => {
        if (element?.current && !element?.current?.contains(e.target as Node)) {
            console.log(e.target)
            console.log(element.current)
            // props.setTrigger(false)
        }
    }

    useEffect(() => {
        document.body.addEventListener('click', close);
        return () => document.body.removeEventListener('click', close);
    });

    return (props.trigger) ? (
        <Container ref={element} className = "popup-container" >
            <div className='popup-top'><h1>{props.title}</h1></div>
            <div className='popup-middle'>{props.content}</div>
            <div className='popup-bottom'>
                <Button onClick={() => props.setTrigger(false)}>Děkuji za informace</Button>
            </div>
        </Container >
    ) : <></>;
}

export default PopUpWindow;