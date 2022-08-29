import React, { FC, useEffect, useState } from 'react';
import '../CSS/Global.css'
import { Button, Col, Container, Row } from "react-bootstrap";

const PopUpWindow = () => {
    return (
        <Container className="popupwindow">
                

            <Row>
                <Col>Text</Col>
            </Row>
            <Row >
                <Col className="align-self-end"><Button variant="info">OK</Button></Col>
                <Col><Button variant="success">YES</Button></Col>
                <Col><Button variant="danger">NO</Button></Col>
            </Row>
        </Container>
    );
}

export default PopUpWindow;