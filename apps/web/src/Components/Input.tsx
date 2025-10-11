import React from "react";
import '@awesome.me/webawesome/dist/components/input/input.js';

const Input = (props: { title: string, type: string, placeholder: string, callback: any, query: string }) => {
    return (
        <div className="form-group mb-3">
            <wa-input
                label={props.title}
                type={props.type}
                placeholder={props.placeholder}
                value={props.query}
                onWaInput={(e: any) => props.callback(e.target.value)}
                appearance="outlined"
                size="medium"
            ></wa-input>
        </div>
    )
}

export default Input;