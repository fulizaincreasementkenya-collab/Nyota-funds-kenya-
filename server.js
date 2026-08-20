const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// CREDENTIALS - ZINATOKA RENDER ENV VARIABLES
const FINAPI_API_KEY = process.env.FINAPI_API_KEY || 'sk_test_a1f9663668ca4e5fbb5644142039967b';
const HASHBACK_API_KEY = process.env.HASHBACK_API_KEY || '1c56caf00541edecf22c978cbae7fa0009072d86bb2d9a877cbb3906678f6e7f'; // <-- HASHBACK KEY YAKO
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://nyota-funds-kenya-citizens-mabp.onrender.com/callback';
const FINAPI_BASE_URL = "https://api.finapi.co.ke"; 
const HASHBACK_BASE_URL = "https://api.hashback.co.ke"; // Confirm na docs za HashBack

console.log("Callback URL:", CALLBACK_URL);

// ROUTE 1: KUTUMA STK PUSH VIA HASHBACK
app.post('/pay', async (req, res) => {
    const { phone, amount, grant_amount, full_name, id_number, occupation } = req.body;

    if (!phone || !amount) {
        return res.status(400).json({ status: "Failed", message: "Phone and Amount required" });
    }

    // Hakikisha namba iko format 2547XXXXXXXX
    let formattedPhone = phone;
    if (phone.startsWith('0')) formattedPhone = '254' + phone.substring(1);
    if (phone.startsWith('7') || phone.startsWith('1')) formattedPhone = '254' + phone;

    try {
        console.log("Sending STK via HashBack to:", formattedPhone, "Amount:", amount);

        const payload = {
            api_key: HASHBACK_API_KEY,
            phone: formattedPhone,
            amount: parseInt(amount),
            callback_url: CALLBACK_URL,
            reference: `NYOTA_${id_number}_${Date.now()}`,
            description: `Nyota Funds Activation Fee KSh ${amount} for ${full_name}`
        };

        const response = await axios.post(`${HASHBACK_BASE_URL}/stkpush`, payload, { // Confirm endpoint
            headers: { 
                'Authorization': `Bearer ${HASHBACK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("HashBack Response:", response.data);
        res.json({ status: "Success", data: response.data });

    } catch (error) {
        console.error("HashBack STK Error:", error.response?.data || error.message);
        res.status(500).json({ 
            status: "Failed", 
            message: error.response?.data?.message || "STK Push failed" 
        });
    }
});

// ROUTE 2: CALLBACK
app.post
