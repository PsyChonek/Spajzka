import React from "react";

const Input = (props: { title: string, type: string, placeholder: string, callback: any, query: string }) => {
    return (
        <div className="form-group mb-3">
            <label className="form-label">{props.title}</label>
            <input
                className="form-control"
                onChange={e => props.callback(e.target.value)}
                type={props.type}
                placeholder={props.placeholder}
                defaultValue={props.query}
            />
        </div>
    )
}

export default Input;