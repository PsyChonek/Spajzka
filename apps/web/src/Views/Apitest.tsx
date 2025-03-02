import '../CSS/Global.css'
import '../CSS/Apitest.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import { GroupModel, ItemModel } from '../Api';
import { UserModel } from '../Api';
import { useCookies } from 'react-cookie';
import { CreateUser, GetUser, GetUserGroups } from '../Other/userService';
import { AddUserToGroup, CreateGroup } from '../Other/groupService';

// STORE TO COOKIE

function Apitest() {

    const [user, setUser] = React.useState('');
    const [group, setGroup] = React.useState('');

    const [cookies, setCookie] = useCookies(['userID', 'userName', 'groupID', 'groupName']);
    // setCookie('userID', query, { path: '/', maxAge: 31536000 });

    return (
        <Container className="content">
            <h1 className="text-center">API test</h1>

            <h2 className="text-center">Cookies</h2>
            <h3 className="text-center">User ID: {cookies.userID}</h3>
            <h3 className="text-center">User Name: {cookies.userName}</h3>
            <h3 className="text-center">Group ID: {cookies.groupID}</h3>
            <h3 className="text-center">Group Name: {cookies.groupName}</h3>

            <br /><br />

            <h2 className="text-center">API</h2>

            <Container className="apitest-row">
                <Container className="apitest-column">
                    <input className='apitest-input' type='text' placeholder='User name' onChange={e => setUser(e.target.value)} value={user} ></input>
                    <Button variant="primary" onClick={() => {

                        // Create account
                        const newUser: UserModel = {
                            name: user,
                            userId: '',
                            password: '',
                            email: '',
                            items: [],
                        }

                        console.log(newUser);

                        var result = CreateUser(newUser);
                        result.then((res) => {
                            if (res == null) return;
                            setCookie('userID', res.data.id, { path: '/', maxAge: 31536000 });
                            setCookie('userName', user, { path: '/', maxAge: 31536000 });
                        });

                    }}>Create Account</Button>

                    <Button variant="primary" onClick={() => {

                        // Get user
                        var result = GetUser(user);

                        result.then((res) => {
                            if (res == null || res.data.id == null) return;
                            setCookie('userID', res.data.id, { path: '/', maxAge: 31536000 });
                            setCookie('userName', user, { path: '/', maxAge: 31536000 });

                            var group = GetUserGroups(res.data.id);
                            group.then((res) => {
                                if (res == null || res.data[0].id == null) return;
                                setCookie('groupID', res.data[0].id, { path: '/', maxAge: 31536000 });
                                setCookie('groupName', res.data[0].name, { path: '/', maxAge: 31536000 });
                            }
                            );
                        });

                    }}>Get Account</Button>
                </Container>

                <Container className="apitest-column">
                    <input className='apitest-input' type='text' placeholder='Group' onChange={e => setGroup(e.target.value)} value={group} disabled={cookies.groupName}></input>
                    <Button variant="primary" onClick={() => {

                        // Create group
                        const newGroup: GroupModel = {
                            name: group
                        }

                        var result = CreateGroup(newGroup);
                        result.then((res) => {
                            if (res == null) return;
                            console.log(res);
                            setCookie('groupID', res.data.id, { path: '/', maxAge: 31536000 });
                            setCookie('groupName', group, { path: '/', maxAge: 31536000 });
                        });

                    }}  disabled={cookies.groupName}>Create group</Button>
                    <Button variant="primary" onClick={() => {

                        // Add user to group
                        var result = AddUserToGroup(group, cookies.userID);
                        result.then((res) => {
                            if (res == null) return;
                            console.log(res);
                            setCookie('groupID', res.data.id, { path: '/', maxAge: 31536000 });
                            setCookie('groupName', group, { path: '/', maxAge: 31536000 });
                        }
                        );

                    }} disabled={cookies.groupName}>Add to group</Button>
                </Container>
            </Container>
        </Container>
    );
}

export default Apitest;