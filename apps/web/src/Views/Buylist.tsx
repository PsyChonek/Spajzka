import '../CSS/Global.css'
import React from "react";
import {Container} from "react-bootstrap";
import Search, {SearchStyle} from "../Components/Search/Search";

function BuyList() {
    return (
        <Container className="content">
            <Search type={SearchStyle.Buylist}/>
        </Container>
    );
}

export default BuyList;