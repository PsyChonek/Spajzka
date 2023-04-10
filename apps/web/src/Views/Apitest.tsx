import '../CSS/Global.css'
import '../CSS/Apitest.css'
import React from "react";
import { Button, Container } from "react-bootstrap";
import { GetUserItems, SaveUserItem } from '../Other/itemService';
import { ItemModel } from '../Api';
import { useCookies } from 'react-cookie';

// STORE TO COOKIE

function Apitest() {

    const [items, setItems] = React.useState<ItemModel[]>([]);
    const [query, setQuery] = React.useState<string>('');
    const [saveResult, setSaveResult] = React.useState<number>(-1);
    const [cookies, setCookie] = useCookies(['userID']);

    return (
        <Container className="content">
            <h1 className="text-center">API test</h1>

            <h2 className="text-center">Cookies</h2>
            <h3 className="text-center">User ID: {cookies.userID}</h3>

            <br /><br />
            <h2 className="text-center">API</h2>

            <Container className="apitest-row">
                <Container className="apitest-column">
                    <h3 className="text-center">Create Account</h3>
                </Container>

                <Container className="apitest-column">
                    <h3 className="text-center">Get Items</h3>
                    <Button variant="primary" onClick={() => {
                        GetUserItems().then((result) => {
                            setItems(result);
                        });
                    }}>Get Items</Button>
                </Container>
            </Container>


            <input className='apitest-input' type='text' placeholder='User ID' onChange={e => setQuery(e.target.value)} value={query} ></input>
            <Button variant="primary" onClick={() => {
                setCookie('userID', query, { path: '/', maxAge: 31536000 });

                GetUserItems().then((result) => {
                    setItems(result);
                });
            }}>Create Account</Button>
            {
                items != null && items.length > 0 ? items.map((item: ItemModel) => {
                    return (
                        <p>{item.name}</p>
                    )
                }) : <p>Nothing</p>
            }

            <h3 className="text-center">Save Item</h3>
            <Container className="apitest-row">
                <Button variant="primary" onClick={() => {
                    var item: ItemModel = {
                        id: 500,
                        name: "Test",
                        price: 0,
                        isOnBuylist: false,
                        amount: 0,
                    }
                    SaveUserItem(item).then((result) => {
                        setSaveResult(result);
                    });

                }}>Get Items</Button>
            </Container>

            {
                saveResult != -1 ? <p>{saveResult}</p> : <p>Nothing</p>
            }
        </Container>
    );
}

export default Apitest;