import React from 'react';
import { Link } from "react-router-dom";
import '../CSS/Global.css'

const FooterCustom = (props: { setActive: any, active: string }) => {

    return (
        <footer className="footer">
            <div className="footer-container">
                <nav className="footer-nav">
                    <Link
                        to="/privacy"
                        onClick={() => props.setActive('privacy')}
                        className={props.active === 'privacy' ? "navbar-link-active" : "navbar-link"}
                    >
                        Privacy
                    </Link>
                    <Link
                        to="/accountdelete"
                        onClick={() => props.setActive('accountdelete')}
                        className={props.active === 'accountdelete' ? "navbar-link-active" : "navbar-link"}
                    >
                        Account Delete
                    </Link>
                </nav>
                <div className="footer-text">
                    Version: {process.env.REACT_APP_VERSION}
                </div>
            </div>
        </footer>
    );

}

export default FooterCustom;