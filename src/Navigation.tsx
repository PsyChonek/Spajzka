import React, {Component} from 'react';
import {Container, Nav, Navbar} from "react-bootstrap";
import {Link, Navigate, Route, Routes} from "react-router-dom";
import Spajz from "./Pages/Spajz";
import Buylist from "./Pages/Buylist";

const Navigation = () => {
    return (
        <body>
        <Navbar className="navbar" bg="dark" variant="dark">
            <Container>
                <Navbar.Brand  className="navbar-button" as={Link} to="/spajz">Špajzka</Navbar.Brand>
                    <Nav defaultActiveKey="/spajz" className="me-auto">
                        <Nav.Link className="navbar-link" as={Link} to="/buylist">Nákupní lístek</Nav.Link>
                    </Nav>
            </Container>
        </Navbar>

        <Routes>
            <Route path="/" element={<Navigate to="/spajz"/>}/>
            <Route path="/spajz"  element={<Spajz/>}/>
            <Route path="/buylist" element={<Buylist/>}/>
        </Routes>
        </body>
    );
}

export default Navigation;