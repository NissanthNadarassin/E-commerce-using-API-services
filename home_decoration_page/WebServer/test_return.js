const axios = require('axios');

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runtest() {
    const API_URL = 'http://localhost:5002/api';
    const email = `test_return_${Date.now()}@test.com`;
    const password = "password123";
    let token;

    try {
        console.log("1. Register/Login...");
        await axios.post(`${API_URL}/auth/signup`, { username: "retuser" + Date.now(), email, password });
        const loginRes = await axios.post(`${API_URL}/auth/signin`, { email, password });
        token = loginRes.data.accessToken;

        console.log("2. Create Order...");
        const orderRes = await axios.post(`${API_URL}/orders`, { items: [{ productId: 1, quantity: 5 }] }, { headers: { 'x-access-token': token } });
        const orderId = orderRes.data.orderId;
        console.log("   Order Created:", orderId);

        console.log("3. Waiting for Delivery (65s)...");
        // Poll status every 10s
        for (let i = 0; i < 12; i++) {
            await wait(10000);
            const delRes = await axios.get(`${API_URL}/orders/${orderId}/delivery`, { headers: { 'x-access-token': token } });
            console.log(`   [${(i + 1) * 10}s] Status: ${delRes.data.status}`);
            if (delRes.data.status === 'delivered' || delRes.data.status === 'completed') break;
        }

        console.log("4. Returning Order...");
        try {
            const retRes = await axios.put(`${API_URL}/orders/${orderId}/return`, {}, { headers: { 'x-access-token': token } });
            console.log("   Return Response:", retRes.data.message); // Expect "Return processed successfully."
            console.log("   Final Status:", retRes.data.order.status);
            console.log("PASS: Order returned.");
        } catch (err) {
            console.error("FAIL: Return failed.", err.response ? err.response.data : err.message);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

runtest();
