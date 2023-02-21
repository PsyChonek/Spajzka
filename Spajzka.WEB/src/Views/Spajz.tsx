import '../CSS/Global.css'

import React, {useEffect} from "react";
import {Button, Container} from "react-bootstrap";
import Search, {SearchStyle} from "../Components/Search/Search";



const Spajz = () => {
    const notificationHelper = () => {
        console.log("notificationHelper");

        if (window.Notification && Notification.permission !== "denied") {
            Notification.requestPermission(function (status) {
                var n = new Notification('Spajzka', {
                    body: 'Spajzka is now available offline!',
                    icon: '/images/icon-512x512.png'
                });
            });
        }
        if (window.Notification && Notification.permission === "granted") {
            var n = new Notification('Spajzka', {
                body: 'Spajzka is now available offline!',
                icon: '/images/icon-512x512.png'
            });
        }
        if (window.Notification && Notification.permission === "denied") {
            console.log("Notifications are denied");
        }
    }
    
    return (
        <Container className="content">
            <Search type={SearchStyle.Spajz}/>
        </Container>
    );
}

export default Spajz;