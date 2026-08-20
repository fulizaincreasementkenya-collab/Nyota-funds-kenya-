const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // weka index.html yako kwa folder 'public'

// CREDENTIALS - ZINATOKA RENDER ENV VARIABLES
const FINAPI_API_KEY = process.env.FINAPI_API_KEY || 'sk_test_a1f9663668ca4e5fbb5644142039967b';
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://nyota-funds-kenya-citizens.onrender.com/callback';
const FINAPI_BASE_URL = "https://api.finapi.co.ke"; // Confirm na docs za FinAPI

console.log("Callback URL:", CALLBACK_URL);

// ROUTE 1: KUTUMA STK PUSH
app.post('/pay', async (req, res) => {
    const { phone, amount, grant_amount, full_name, id_number, occupation } = req.body;

    if (!phone || !amount) {
        return res.status(400).json({ status: "Failed", message: "Phone and Amount required" });
    }

    try {
        console.log("Sending STK to:", phone, "Amount:", amount);

        const payload = {
            api_key: FINAPI_API_KEY,
            phone_number: phone,
            amount: parseInt(amount),
            callback_url: CALLBACK_URL,
            reference: `NYOTA_${id_number}_${Date.now()}`,
            description: `Nyota Funds Activation Fee KSh ${amount} for ${full_name}`
        };

        const response = await axios.post(`${FINAPI_BASE_URL}/stk/push`, payload, {
            headers: { 
                'Authorization': `Bearer ${FINAPI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("FinAPI Response:", response.data);
        res.json({ status: "Success", data: response.data });

    } catch (error) {
        console.error("STK Error:", error.response?.data || error.message);
        res.status(500).json({ 
            status: "Failed", 
            message: error.response?.data?.message || "STK Push failed" 
        });
    }
});

// ROUTE 2: CALLBACK - HAPA FINAPI ITAKURUSHIA STATUS
app.post('/callback', (req, res) => {
    console.log("========== CALLBACK RECEIVED ==========");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("=======================================");

    const { status, reference, phone, amount, transaction_id } = req.body;
    
    // Hapa unaweza save kwa database
    // Kama status === 'success' basi grant imelipwa

    res.status(200).json({ status: "Received" });
});

// ROUTE 3: HEALTH CHECK
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Nyota Funds Server running on port ${PORT}`));
