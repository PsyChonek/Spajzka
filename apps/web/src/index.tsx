import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as serviceWorkerRegistration from './Other/serviceWorkerRegistration';
import reportWebVitals from "./Other/reportWebVitals";
import Navigation from "./Views/Navigation";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <BrowserRouter>
        <Navigation />
    </BrowserRouter>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register()

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

navigator.serviceWorker.addEventListener('message', function (event) {
    console.log('Got reply from service worker: ' + event.data);

    if (event.data === 'reload') {
        window.location.reload();
    }
});

const handleMessage = (event: MessageEvent) => {
    if (event.data === 'reload') {
        window.location.reload();
    }
};
navigator.serviceWorker.addEventListener('message', handleMessage);