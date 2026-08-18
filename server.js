const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/pay', async (req, res) => {
    try {
        const { phone, amount } = req.body;

        if (!phone || !amount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number and amount are required.' 
            });
        }

        const payload = {
            provider: process.env.FINAPI_PROVIDER || 'swiftwallet',
            phone: phone,
            amount: Number(amount)
        };

        const response = await axios.post(
            'https://stkpush.co.ke/stk/push',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.FINAPI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        return res.status(200).json({
            success: true,
            status: 'Prompt Sent',
            data: response.data
        });

    } catch (error) {
        console.error('FinAPI Execution Error:', error.response ? error.response.data : error.message);
        
        return res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to trigger M-Pesa push notification.'
        });
    }
});

app.post('/api/callback', (req, res) => {
    console.log('Payment Callback Received:', req.body);
    res.status(200).json({ status: 'SUCCESS' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
