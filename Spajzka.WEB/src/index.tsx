import 'bootstrap/dist/css/bootstrap.min.css';

import React, {useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Link, Navigate, Route, Routes} from 'react-router-dom';
import {Container, Nav, Navbar} from 'react-bootstrap';
import * as serviceWorkerRegistration from './Other/serviceWorkerRegistration';
import reportWebVitals from "./Other/reportWebVitals";
import Search from "./Components/Search/Search";
import Spajz from "./Pages/Spajz";
import Buylist from "./Pages/Buylist";
import Navigation from "./Navigation";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const notificationHelper = (text :string) => {
    if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission(function (status) {
            var n = new Notification('Spajzka', {
                body: text,
                icon: '/images/icon-512x512.png'
            });
        });
    }
    if (window.Notification && Notification.permission === "granted") {
        var n = new Notification('Spajzka', {
            body: text,
            icon: '/images/icon-512x512.png'
        });
    }
}

root.render(
    <BrowserRouter>
        <Navigation/>
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

notificationHelper("Test");