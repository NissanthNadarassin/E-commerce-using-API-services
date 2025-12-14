const axios = require('axios');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function verifyCancelBlocking() {
    const url = 'http://localhost:5002/graphql';
    const authUrl = 'http://localhost:5002/api/auth';

    // Login
    let token = "";
    try {
        const loginRes = await axios.post(`${authUrl}/login`, {
            email: "test_cancel@example.com",
            password: "password123"
        });
        token = loginRes.data.accessToken;
    } catch (e) {
        // Register if fail
        const username = "canceluser_" + Date.now();
        const email = `test_cancel@example.com`;
        await axios.post(`${authUrl}/register`, { username, email, password: "password123" });
        const loginRes = await axios.post(`${authUrl}/login`, { email, password: "password123" });
        token = loginRes.data.accessToken;
    }
    const headers = { "x-access-token": token };

    // Create Order
    const createMutation = `
    mutation {
      createOrder(items: [{productId: 1, quantity: 1}]) {
        id
      }
    }
  `;
    const createRes = await axios.post(url, { query: createMutation }, { headers });
    const orderId = createRes.data.data.createOrder.id;
    console.log(`Order ${orderId} Created. Waiting 35 seconds to reach En Route...`);

    await sleep(35000);

    // Try Cancel
    const cancelMutation = `
    mutation {
      cancelOrder(id: ${orderId}) {
        id
        status
      }
    }
  `;

    try {
        const res = await axios.post(url, { query: cancelMutation }, { headers });
        console.log("Cancel Response:", JSON.stringify(res.data, null, 2));
        if (res.data.errors) {
            console.log("SUCCESS: Cancellation blocked as expected.");
        } else {
            console.error("FAILURE: Order was cancelled but should have been blocked!");
        }
    } catch (error) {
        console.error("Error cancelling order:", error.message);
    }
}

verifyCancelBlocking();
