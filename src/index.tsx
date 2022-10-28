import 'bootstrap/dist/css/bootstrap.min.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Link, Navigate, Route, Routes} from 'react-router-dom';
import {Container, Nav, Navbar} from 'react-bootstrap';
import * as serviceWorkerRegistration from './Other/serviceWorkerRegistration';
import reportWebVitals from "./Other/reportWebVitals";
import Search from "./Components/Search/Search";
import Spajz from "./Pages/Spajz";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <BrowserRouter>
        <React.StrictMode>

            <Navbar className="navbar" bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand as={Link} to="/">Špajzka</Navbar.Brand>
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/buylist">Nákupní lístek</Nav.Link>
                    </Nav>
                </Container>
            </Navbar>


            <Routes>
                <Route path="/" element={<Spajz/>}/>
            </Routes>


        </React.StrictMode>
    </BrowserRouter>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
