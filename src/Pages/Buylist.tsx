import '../CSS/Global.css'

import React from "react";
import {Container} from "react-bootstrap";
import Search, {SearchStyle} from "../Components/Search/Search";

function Buylist() {
    return (
        <Container className="content">
            <Search type={SearchStyle.BuyList}/>
        </Container>
    );
}

export default Buylist;