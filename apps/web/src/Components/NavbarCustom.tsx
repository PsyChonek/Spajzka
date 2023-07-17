import React, { Component, useEffect } from 'react';
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import '../CSS/Global.css'

const NavbarCustom = (props: { setActive: any, active: string }) => {
    return (
        <Navbar className="navbar" bg="dark" variant="dark">
            <Container>
                <Navbar.Brand onClick={() => props.setActive('spajz')} className={"navbar-link"} as={Link} to="/spajz">Špajzka</Navbar.Brand>
                <Nav defaultActiveKey="/" className="me-auto">
                    <Nav.Link onClick={() => props.setActive('buylist')} className={props.active === 'buylist' ? "navbar-link-active" : "navbar-link"} as={Link} to="/buylist">Nákupní lístek</Nav.Link>
                    <Nav.Link onClick={() => props.setActive('apitest')} className={props.active === 'apitest' ? "navbar-link-active" : "navbar-link"} as={Link} to="/apitest">API</Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    )
};

export default NavbarCustom;