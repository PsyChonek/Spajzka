import '../CSS/Global.css'
import React from "react";
import Search, {SearchStyle} from "../Components/Search/Search";

function BuyList() {
    return (
        <div className="content">
            <Search type={SearchStyle.Buylist}/>
        </div>
    );
}

export default BuyList;