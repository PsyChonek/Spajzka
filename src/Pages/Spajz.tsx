import '../CSS/Global.css'

import React from "react";
import {Container} from "react-bootstrap";
import Search from "../Components/Search/Search";

function Spajz() {
    return (
        <Container className="content">
            <Search/>
        </Container>
    );
}

export default Spajz;