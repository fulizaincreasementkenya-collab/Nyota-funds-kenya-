const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

// STK Push Processing Endpoint
app.post('/pay', async (req, res) => {
    try {
        const { phone, amount, grant_amount, full_name, id_number, occupation } = req.body;

        // Validation check for required parameters
        if (!phone || !amount) {
            return res.status(400).json({
                status: 'Error',
                message: 'Phone number and payment amount are required.'
            });
        }

        // Format and payload setup for M-PESA STK Push gateway
        const payload = {
            provider: process.env.PAYMENT_PROVIDER || 'swiftwallet',
            phone: phone.replace(/\+/g, ''), // Ensure clean 254 format
            amount: Number(amount),
            meta: {
                grant_amount: grant_amount || 0,
                full_name: full_name || '',
                id_number: id_number || '',
                occupation: occupation || ''
            }
        };

        const gatewayUrl = process.env.PAYMENT_GATEWAY_URL || 'https://stkpush.co.ke/stk/push';
        
        const response = await axios.post(
            gatewayUrl,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PAYMENT_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 12000
            }
        );

        return res.status(200).json({
            status: 'Success',
            message: 'STK Push sent successfully.',
            data: response.data
        });

    } catch (error) {
        console.error('Payment Error:', error.response ? error.response.data : error.message);

        return res.status(500).json({
            status: 'Error',
            message: error.response?.data?.message || 'Failed to trigger payment prompt. Please try again.'
        });
    }
});

// Callback Webhook Endpoint for Payment Confirmation
app.post('/callback', (req, res) => {
    console.log('Payment Callback Received:', JSON.stringify(req.body, null, 2));
    
    // Process callback data here (e.g., save status to database)
    
    res.status(200).json({ status: 'SUCCESS', message: 'Callback processed' });
});

// Serve frontend index.html on wildcard routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
