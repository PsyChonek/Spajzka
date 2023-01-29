import '../CSS/Global.css'

import React from "react";
import {Button, Container} from "react-bootstrap";
import Search, {SearchStyle} from "../Components/Search/Search";

const Spajz = () => {
    return (
        <Container className="content">
            <Search type={SearchStyle.Spajz}/>
            <Button onClick={() => {
                navigator.serviceWorker.getRegistration().then((registration: ServiceWorkerRegistration | undefined) => {
                    if (registration && registration.active) {
                        (registration.active as ServiceWorker).postMessage("Hello from the client!");
                    } else {
                        console.log("No active service worker found.");
                    }
                });
            }}>Click me</Button>
        </Container>
    );
}

export default Spajz;