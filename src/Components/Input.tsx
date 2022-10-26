import {Form} from "react-bootstrap";
import React from "react";
import exp from "constants";

const Input = (props: { title: string, type: string, placeholder: string }) => {
    return (<Form.Group className="mb-3">
        <Form.Label>{props.title}</Form.Label>
        <Form.Control type={props.type} placeholder={props.placeholder}/>
    </Form.Group>);
}

export default Input;