import {Form} from "react-bootstrap";
import React from "react";

const Input = (props: { title: string, type: string, placeholder: string, callback: any, query: string }) => {
    return (
        <Form.Group className="mb-3">
            <Form.Label>{props.title}</Form.Label>
            <Form.Control onChange={e => {
                props.callback(e.target.value)
            }
            } type={props.type} placeholder={props.placeholder} defaultValue={props.query}/>
        </Form.Group>
    )
}

export default Input;