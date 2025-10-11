import '../CSS/Global.css'
import React from "react";
import Search, {SearchStyle} from "../Components/Search/Search";

const Spajz = () => {
    return (
        <div className="content">
            <Search type={SearchStyle.Spajz}/>
        </div>
    );
}

export default Spajz;