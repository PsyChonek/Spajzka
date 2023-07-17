import React, { Component, useEffect } from 'react';
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import '../CSS/Global.css'

const FooterCustom = (props: { setActive: any, active: string }) => {

    return (
        <>
            <Navbar className="footer" bg="dark" variant="dark">
                <Container>
                    <Nav defaultActiveKey="/" className="me-auto">
                        <Nav.Link onClick={() => props.setActive('privacy')} className={props.active === 'privacy' ? "navbar-link-active" : "navbar-link"} as={Link} to="/privacy">Privacy</Nav.Link>
                        <Nav.Link onClick={() => props.setActive('accountdelete')} className={props.active === 'accountdelete' ? "navbar-link-active" : "navbar-link"} as={Link} to="/accountdelete">Account Delete</Nav.Link>
                    </Nav>
                    {/* Get version from package.json */}
                    <Navbar.Text>
                        Version: {process.env.REACT_APP_VERSION}
                    </Navbar.Text>
                </Container>
            </Navbar>
        </>
    );

}

export default FooterCustom;