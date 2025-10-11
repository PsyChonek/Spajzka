import React, { useEffect, useState } from 'react';
import { Route, Routes } from "react-router-dom";
import Spajz from "./Spajz";
import BuyList from "./BuyList";
import ApiTest from './ApiTest';
import FooterCustom from '../Components/FooterCustom';
import NavbarCustom from '../Components/NavbarCustom';
import Privacy from './Privacy';
import AccountDelete from './AccountDelete';
import { initializeAuth } from '../Other/authInitializer';
import ThemeDebug from '../Components/ThemeDebug';

const Navigation = () => {

    const [active, setActive] = useState("");
    const [authInitialized, setAuthInitialized] = useState(false);

    const validURLs = ["spajz", "buylist", "apitest", "", "privacy", "accountdelete"];

    const set = (url: string) => {
        if (validURLs.includes(url)) {
            setActive(url);
        } else {
            setActive("");
            window.location.href = "/";
        }
    }

    // Initialize authentication on mount
    useEffect(() => {
        const initAuth = async () => {
            await initializeAuth();
            setAuthInitialized(true);
        };
        initAuth();
    }, []);

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
                <Route path="/buylist" element={<BuyList />} />
                <Route path="/apitest" element={<ApiTest />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/accountdelete" element={<AccountDelete />} />
            </Routes>

            <FooterCustom setActive={setActive} active={active} />
            
            {/* Temporary debug component - remove after testing */}
            <ThemeDebug />
        </>
    );

}

export default Navigation;