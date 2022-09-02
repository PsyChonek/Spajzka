import '../CSS/Popup.css'
import { Button, Col, Container, Row } from "react-bootstrap";

const PopUpWindow = (props: {trigger: any, setTrigger: any, title: string, content: string }) => {

    return (props.trigger) ? (
        <div onClick={() => props.setTrigger(false)}>
            <Container className="popup-container">
                <div className='popup-top'><h1>{props.title}</h1></div>
                <div className='popup-middle'>{props.content}</div>
                <div className='popup-bottom'>
                    <Button onClick={() => props.setTrigger(false)}>Děkuji za informace</Button>
                </div>
            </Container>
        </div>
    ) : <></>;
}

export default PopUpWindow;