const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function verifyTiming() {
    const url = 'http://localhost:5002/graphql';
    const authUrl = 'http://localhost:5002/api/auth';

    // Login
    let token = "";
    try {
        const loginRes = await axios.post(`${authUrl}/login`, {
            email: "test_123@example.com", // Reuse or Register new
            password: "password123"
        });
        token = loginRes.data.accessToken;
    } catch (e) {
        // Register if fail
        const username = "timeuser_" + Date.now();
        const email = `time_${Date.now()}@example.com`;
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
        createdAt
      }
    }
  `;
    const createRes = await axios.post(url, { query: createMutation }, { headers });
    const orderId = createRes.data.data.createOrder.id;
    console.log(`Order ${orderId} Created at ${new Date().toISOString()}`);

    const checkStatus = async () => {
        const query = `
        query {
          me {
            orders {
              id
              status
              delivery {
                estimatedArrival
              }
            }
          }
        }
      `;
        const res = await axios.post(url, { query }, { headers });
        const order = res.data.data.me.orders.find(o => o.id === orderId);
        return order ? order.status : "Unknown";
    };

    // Poll for 70 seconds
    for (let i = 0; i < 7; i++) { // Check every 10s
        const status = await checkStatus();
        console.log(`Time: ${i * 10}s - Status: ${status}`);
        await sleep(10000);
    }
}

verifyTiming();
