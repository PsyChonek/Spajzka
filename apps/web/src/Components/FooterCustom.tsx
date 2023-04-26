import React, { Component, useEffect } from 'react';
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import '../CSS/Global.css'

const FooterCustom = (props: { setActive: any, active: string }) => {

    return (
        <>
            <Navbar className="footer" bg="dark" variant="dark">
                <Container>
                <Nav.Link onClick={() => props.setActive('privacy')} className={"navbar-link"} as={Link} to="/privacy">Privacy</Nav.Link>
                </Container>
            </Navbar>
        </>
    );

}

export default FooterCustom;