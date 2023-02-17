const requestPermission = (text: string) => {
    if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission(function (status) {
            console.log("Notification permission status:", status);
        });
    }
}

const notify = (text: string, ) => {
    if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission(function (status) {
            var n = new Notification(text);
        });
    }
}

export default {
    notify
}