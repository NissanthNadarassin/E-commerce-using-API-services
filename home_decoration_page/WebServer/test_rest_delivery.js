const axios = require('axios');

async function runtest() {
    const API_URL = 'http://localhost:5002/api';

    // 1. Register/Login
    const email = `test_delivery_${Date.now()}@test.com`;
    const password = "password123";

    let token;
    let userId;

    try {
        console.log("Registering...");
        await axios.post(`${API_URL}/auth/signup`, {
            username: "testuser" + Date.now(),
            email: email,
            password: password
        });

        console.log("Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/signin`, {
            email: email, // ensure controller supports email login
            password: password
        });

        token = loginRes.data.accessToken;
        userId = loginRes.data.id;
        console.log("Logged in. Token:", token ? "YES" : "NO");

        // 2. Create Order
        console.log("Creating Order...");
        const orderRes = await axios.post(`${API_URL}/orders`, {
            items: [{ productId: 1, quantity: 1 }],
            shippingAddressId: null
        }, {
            headers: { 'x-access-token': token }
        });

        const orderId = orderRes.data.orderId;
        console.log("Order Created:", orderId);

        // 3. Get Delivery Info
        console.log("Fetching Delivery Info...");
        const deliveryRes = await axios.get(`${API_URL}/orders/${orderId}/delivery`, {
            headers: { 'x-access-token': token }
        });

        const deliveryPlan = deliveryRes.data;
        console.log("Delivery Plan Status:", deliveryPlan.status);
        console.log("ETA:", deliveryPlan.allocations[0].eta);
        console.log("Window Start:", deliveryPlan.windowStart);
        console.log("Window End:", deliveryPlan.windowEnd);

        const winStart = new Date(deliveryPlan.windowStart);
        const winEnd = new Date(deliveryPlan.windowEnd);
        const winDiffMin = (winEnd - winStart) / 1000 / 60;
        console.log(`Window Duration: ${winDiffMin} minutes`);

        if (Math.abs(winDiffMin - 2) < 0.1) {
            console.log("PASS: Window is approx 2 minutes.");
        } else {
            console.error(`FAIL: Window is ${winDiffMin} minutes (Expected ~2).`);
        }

        const etaDate = new Date(deliveryPlan.allocations[0].eta);
        const now = new Date();
        const diffMs = etaDate - now;

        console.log(`ETA is in ${Math.round(diffMs / 1000)} seconds.`);

        if (diffMs > 3600000) {
            console.error("FAIL: ETA is more than 1 hour away. Likely using Logic Mode or Business Logic.");
        } else if (diffMs < 0) {
            console.log("ETA is past? Maybe just created.");
        } else {
            console.log("PASS: ETA is within reasonable demo range.");
        }

    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

runtest();
