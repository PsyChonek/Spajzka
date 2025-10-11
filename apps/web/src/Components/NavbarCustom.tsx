import React from 'react';
import { Link } from "react-router-dom";
import ThemeSwitch from './ThemeSwitch';
import '../CSS/Global.css'

const NavbarCustom = (props: { setActive: any, active: string }) => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link
                    to="/spajz"
                    onClick={() => props.setActive('spajz')}
                    className="navbar-brand navbar-link"
                >
                    Špajzka
                </Link>
                <div className="navbar-nav">
                    <Link
                        to="/buylist"
                        onClick={() => props.setActive('buylist')}
                        className={props.active === 'buylist' ? "navbar-link-active" : "navbar-link"}
                    >
                        Nákupní lístek
                    </Link>
                    <Link
                        to="/apitest"
                        onClick={() => props.setActive('apitest')}
                        className={props.active === 'apitest' ? "navbar-link-active" : "navbar-link"}
                    >
                        API
                    </Link>
                    <ThemeSwitch />
                </div>
            </div>
        </nav>
    )
};

export default NavbarCustom;