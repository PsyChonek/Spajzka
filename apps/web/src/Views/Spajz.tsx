import '../CSS/Global.css'
import React, {useEffect} from "react";
import {Button, Container} from "react-bootstrap";
import Search, {SearchStyle} from "../Components/Search/Search";

const Spajz = () => {
    return (
        <Container className="content">
            <Search type={SearchStyle.Spajz}/>
        </Container>
    );
}

export default Spajz;