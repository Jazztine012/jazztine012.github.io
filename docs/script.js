let cashierQueue = 1;
let registrarQueue = 1;
let frontDeskQueue = 1;

// Generates QR Code to be scanned by the customer
function generateQRCode(elementId, location, queueNumber) {
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    const formattedTimestamp = now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    const qrCodeURL = `https://yourdomain.github.io/qrcodeSTI/public/queue.html?location=${location}&queue=${queueNumber}&timestamp=${timestamp}`;
    document.getElementById(elementId).innerHTML = '';
    new QRCode(document.getElementById(elementId), {
        text: qrCodeURL,
        width: 150,
        height: 150
    });
    document.getElementById(`${elementId}-queue-number`).innerText = queueNumber;
    document.getElementById(`${elementId}-timestamp`).innerText = formattedTimestamp;
    console.log(`QR Code generated for: ${qrCodeURL}`);
}

// Refresh QR codes for all locations
function refreshQRCodes() {
    generateQRCode('cashier', 'cashier', cashierQueue);
    generateQRCode('registrar', 'registrar', registrarQueue);
    generateQRCode('front-desk', 'front-desk', frontDeskQueue);
}

// WebSocket connection for real-time updates
const socket = new WebSocket('ws://localhost:3000');

// Listen for queue updates from server
socket.addEventListener('message', function(event) {
    const customerData = JSON.parse(event.data);
    console.log('Received customer data:', customerData);
    updateQueueNumbers(customerData.location, customerData.queueNumber);
    displayScannedCustomer(customerData);
});

// Update queue numbers and regenerate QR codes
function updateQueueNumbers(location, newQueueNumber) {
    if (location === 'cashier') {
        cashierQueue = newQueueNumber;
    } else if (location === 'registrar') {
        registrarQueue = newQueueNumber;
    } else if (location === 'front-desk') {
        frontDeskQueue = newQueueNumber;
    }
    refreshQRCodes();
}

// Display scanned customer info on the page
function displayScannedCustomer(data) {
    const list = document.getElementById('scanned-customers');
    const listItem = document.createElement('li');
    listItem.textContent = `Customer joined: Location: ${data.location}, Queue: ${data.queueNumber}, Time: ${data.timestamp}`;
    list.appendChild(listItem);
}

// Initial QR code generation and periodic refresh
refreshQRCodes();
setInterval(refreshQRCodes, 30000);
