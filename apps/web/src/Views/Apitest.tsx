import '../CSS/Global.css'
import '../CSS/Apitest.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import { GetUserItems, SaveUserItem } from '../Other/itemService';
import { ItemModel } from '../Api';
import { UserModel } from '../Api';
import { useCookies } from 'react-cookie';
import { CreateUser } from '../Other/userService';

// STORE TO COOKIE

function Apitest() {

    const [user, setUser] = React.useState('');
    const [group, setGroup] = React.useState('');

    // const [cookies, setCookie] = useCookies(['userID', 'userName']);
    // setCookie('userID', query, { path: '/', maxAge: 31536000 });

    return (
        <Container className="content">
            <h1 className="text-center">API test</h1>

            <h2 className="text-center">Cookies</h2>
            {/* <h3 className="text-center">User ID: {cookies.userID}</h3> */}
            {/* <h3 className="text-center">User ID: {cookies.userName}</h3> */}

            <br /><br />

            <h2 className="text-center">API</h2>

            <Container className="apitest-row">
                <Container className="apitest-column">
                    <input className='apitest-input' type='text' placeholder='User name' onChange={e => setUser(e.target.value)} value={user} ></input>
                    <Button variant="primary" onClick={() => {
                        // Create account
                        const newUser: UserModel = {
                            name: user
                        }

                        var result = CreateUser(newUser);

                        result.then((value) => {
                            console.log(value)
                        });

                    }}>Create Account</Button>
                </Container>

                <Container className="apitest-column">
                    <input className='apitest-input' type='text' placeholder='Group' onChange={e => setGroup(e.target.value)} value={group} ></input>
                    <Button variant="primary" onClick={() => {
                        // Add group
                    }}>Add group</Button>
                </Container>
            </Container>

            <Container className="apitest-row">

            </Container>
        </Container>
    );
}

export default Apitest;