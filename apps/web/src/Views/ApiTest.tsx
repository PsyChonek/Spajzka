import '../CSS/Global.css'
import '../CSS/Apitest.css'
import React from "react";
import { Api, CreateUserDto, CreateGroupDto, LoginDto } from '../Api';
import { useCookies } from 'react-cookie';
import { GetUser, GetUserGroups } from '../Other/userService';
import { AddUserToGroup, CreateGroup } from '../Other/groupService';

const apiClient = new Api({
    baseUrl: process.env.REACT_APP_SpajzkaAPI,
})

function ApiTest() {

    const [username, setUsername] = React.useState('');
    const [accessCode, setAccessCode] = React.useState('');
    const [group, setGroup] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [messageType, setMessageType] = React.useState<'success' | 'danger' | 'info'>('info');

    const [cookies, setCookie, removeCookie] = useCookies(['userID', 'userName', 'groupID', 'groupName', 'token', 'accessCode']);

    const showMessage = (msg: string, type: 'success' | 'danger' | 'info') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    return (
        <div className="content">
            <h1 className="text-center">API Test - Passwordless Auth</h1>

            {message && <div className={`alert alert-${messageType}`}>{message}</div>}

            <h2 className="text-center">Session</h2>
            <h3 className="text-center">User ID: {cookies.userID}</h3>
            <h3 className="text-center">User Name: {cookies.userName}</h3>
            <h3 className="text-center">Access Code: {cookies.accessCode ? '****-****-****' : 'None'}</h3>
            <h3 className="text-center">Group ID: {cookies.groupID}</h3>
            <h3 className="text-center">Group Name: {cookies.groupName}</h3>
            {cookies.token && (
                <div className="text-center">
                    <button className="btn btn-danger" onClick={() => {
                        removeCookie('userID');
                        removeCookie('userName');
                        removeCookie('token');
                        removeCookie('accessCode');
                        removeCookie('groupID');
                        removeCookie('groupName');
                        showMessage('Logged out successfully', 'success');
                    }}>Logout</button>
                </div>
            )}

            <br /><br />

            <h2 className="text-center">Authentication</h2>

            <div className="apitest-row">
                <div className="apitest-column">
                    <h3>Set Username</h3>
                    <p style={{fontSize: '12px'}}>
                        {cookies.userName?.startsWith('guest_')
                            ? 'Upgrade your guest account by choosing a username'
                            : 'Change your username'}
                    </p>
                    <input className='apitest-input' type='text' placeholder='Username' onChange={e => setUsername(e.target.value)} value={username} ></input>
                    <button className="btn btn-primary" onClick={async () => {
                        try {
                            if (!cookies.token) {
                                showMessage('You must be logged in to set a username', 'danger');
                                return;
                            }

                            const client = new Api({
                                baseUrl: process.env.REACT_APP_SpajzkaAPI,
                                securityWorker: () => ({ headers: { Authorization: `Bearer ${cookies.token}` } })
                            });

                            const upgradeData = {
                                username: username,
                                displayName: username,
                            }

                            const result = await client.auth.upgradeGuest(upgradeData);

                            if (result.data) {
                                setCookie('userName', result.data.username, { path: '/', maxAge: 31536000 });
                                showMessage(`Username updated to: ${result.data.username}`, 'success');
                                setUsername('');
                            }
                        } catch (e: any) {
                            showMessage(`Error: ${e.message}`, 'danger');
                        }
                    }}>Set Username</button>
                </div>

                <div className="apitest-column">
                    <h3>Login</h3>
                    <input className='apitest-input' type='text' placeholder='Access Code (UUID)' onChange={e => setAccessCode(e.target.value)} value={accessCode} ></input>
                    <button className="btn btn-success" onClick={async () => {
                        try {
                            const loginData: LoginDto = {
                                accessCode: accessCode,
                            }

                            const result = await apiClient.auth.login(loginData);

                            if (result.data.token) {
                                setCookie('token', result.data.token, { path: '/', maxAge: 31536000 });
                                setCookie('userID', result.data.user.id, { path: '/', maxAge: 31536000 });
                                setCookie('userName', result.data.user.username, { path: '/', maxAge: 31536000 });
                                setCookie('accessCode', accessCode, { path: '/', maxAge: 31536000 });
                                showMessage(`Logged in as ${result.data.user.username}!`, 'success');

                                // Load user's groups
                                const groups = await GetUserGroups(result.data.user.id);
                                if (groups && groups.data && groups.data.length > 0) {
                                    const firstGroup = groups.data[0];
                                    setCookie('groupID', firstGroup.id, { path: '/', maxAge: 31536000 });
                                    setCookie('groupName', firstGroup.name, { path: '/', maxAge: 31536000 });
                                }
                            }
                        } catch (e: any) {
                            showMessage(`Login failed: ${e.message}`, 'danger');
                        }
                    }}>Login</button>
                </div>
            </div>

            {cookies.token && (
                <>
                    <br /><br />
                    <h2 className="text-center">Account Management</h2>
                    <div className="apitest-row">
                        <div className="apitest-column">
                            <h3>Reset Access Code</h3>
                            <p style={{fontSize: '12px'}}>This will generate a new access code and logout all devices</p>
                            <button className="btn btn-warning" onClick={async () => {
                                try {
                                    const client = new Api({
                                        baseUrl: process.env.REACT_APP_SpajzkaAPI,
                                        securityWorker: () => ({ headers: { Authorization: `Bearer ${cookies.token}` } })
                                    });

                                    const result = await client.auth.resetAccessCode();

                                    if (result.data.accessCode) {
                                        setCookie('accessCode', result.data.accessCode, { path: '/', maxAge: 31536000 });
                                        setAccessCode(result.data.accessCode);
                                        showMessage(`New access code: ${result.data.accessCode} - Save it!`, 'success');
                                    }
                                } catch (e: any) {
                                    showMessage(`Error: ${e.message}`, 'danger');
                                }
                            }}>Reset Access Code</button>
                        </div>
                    </div>

                    <br /><br />
                    <h2 className="text-center">Groups</h2>
                    <div className="apitest-row">
                        <div className="apitest-column">
                            <input className='apitest-input' type='text' placeholder='Group name' onChange={e => setGroup(e.target.value)} value={group}></input>
                            <button className="btn btn-primary" onClick={async () => {
                                try {
                                    const newGroup: CreateGroupDto = {
                                        name: group,
                                        userIds: []
                                    }

                                    const result = await CreateGroup(newGroup);
                                    if (result) {
                                        setCookie('groupID', result.data.id, { path: '/', maxAge: 31536000 });
                                        setCookie('groupName', group, { path: '/', maxAge: 31536000 });
                                        showMessage(`Group "${group}" created!`, 'success');
                                        setGroup('');
                                    }
                                } catch (e: any) {
                                    showMessage(`Error: ${e.message}`, 'danger');
                                }
                            }}>Create Group</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ApiTest;