import React, {Component, useEffect} from 'react';
import {Container, Nav, Navbar} from "react-bootstrap";
import {Link, Navigate, Route, Routes} from "react-router-dom";
import Spajz from "./Spajz";
import Buylist from "./Buylist";

const Navigation = () => {

    const [active, setActive] = React.useState("");

    const validURLs = ["spajz", "buylist"];

    useEffect(() => {
        var url: string = window.location.pathname.split("/")[1];
        if (validURLs.includes(url)) {
            setActive(url);
        } else {
            setActive("");
            window.location.href = "/";
        }
    }, [window.location.pathname]);

    return (
        <>
            <Navbar className="navbar" bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand onClick={() => setActive('spajz')} className={active === 'spajz' ? "navbar-link-active" : "navbar-link"} as={Link} to="/spajz">Špajzka</Navbar.Brand>
                    <Nav defaultActiveKey="/spajz" className="me-auto">
                        <Nav.Link onClick={() => setActive('buylist')} className={active === 'buylist' ? "navbar-link-active" : "navbar-link"} as={Link} to="/buylist">Nákupní lístek</Nav.Link>
                    </Nav>
                </Container>
            </Navbar>

            <Routes>
                <Route path="/" element={<Navigate to="/spajz"/>}/>
                <Route path="/spajz" element={<Spajz/>}/>
                <Route path="/buylist" element={<Buylist/>}/>
            </Routes>
        </>
    );

}

export default Navigation;