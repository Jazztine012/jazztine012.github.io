const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let cashierQueue = 1;
let registrarQueue = 1;
let frontDeskQueue = 1;
let sseClients = [];

// Helper function to handle queue updates
function getNextQueueNumber(location) {
    switch(location) {
        case 'cashier':
            return ++cashierQueue;
        case 'registrar':
            return ++registrarQueue;
        case 'front-desk':
            return ++frontDeskQueue;
        default:
            throw new Error('Invalid location');
    }
}

// Helper function for broadcasting customer updates to SSE clients
function broadcastCustomerUpdate(data) {
    sseClients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
}

// Serve queue HTML page
app.get('/join-queue', (req, res) => {
    res.sendFile(path.join(__dirname, 'qrcodeSTI/public/queue.html'));
});

// SSE Endpoint for real-time updates
app.get('/api/customer-updates', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    sseClients.push(res);
    const keepAliveInterval = setInterval(() => res.write(': keep-alive\n\n'), 20000);

    req.on('close', () => {
        clearInterval(keepAliveInterval);
        sseClients = sseClients.filter(client => client !== res);
    });
});

// API Endpoint for handling QR scan and customer data updates
app.post('/api/customer-scanned', (req, res) => {
    try {
        const { location } = req.body;
        const queueNumber = getNextQueueNumber(location);
        const timestamp = new Date().toLocaleString();

        const responseData = { location, queueNumber, timestamp };
        broadcastCustomerUpdate(responseData);
        res.json(responseData);

    } catch (error) {
        console.error('Error updating customer data:', error);
        res.status(400).json({ error: 'Invalid request' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
