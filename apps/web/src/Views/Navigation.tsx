﻿import React, { Component, useEffect } from 'react';
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Spajz from "./Spajz";
import Buylist from "./Buylist";
import Apitest from './Apitest';
import FooterCustom from '../Components/FooterCustom';
import NavbarCustom from '../Components/NavbarCustom';
import Privacy from './Privacy';

const Navigation = () => {

    const [active, setActive] = React.useState("");

    const validURLs = ["spajz", "buylist", "apitest", "", "privacy", "accountdelete"];

    const set = (url: string) => {
        if (validURLs.includes(url)) {
            setActive(url);
        } else {
            setActive("");
            window.location.href = "/";
        }
    }

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
            <NavbarCustom setActive={setActive} active={active} />

            <Routes>
                <Route path="/" element={<Spajz />} />
                <Route path="/spajz" element={<Spajz />} />
                <Route path="/buylist" element={<Buylist />} />
                <Route path="/apitest" element={<Apitest />} />
                <Route path="/privacy" element={<Privacy />} />
            </Routes>
            
            <FooterCustom setActive={setActive} active={active} />
        </>
    );

}

export default Navigation;