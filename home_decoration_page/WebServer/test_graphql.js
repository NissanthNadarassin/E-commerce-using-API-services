const axios = require('axios');

async function testGraphQL() {
    const url = 'http://localhost:5002/graphql';

    const query = `
    query {
      products {
        id
        product_name
        price
      }
      recommendations {
        id
        product_name
      }
    }
  `;

    try {
        const response = await axios.post(url, { query });
        console.log("GraphQL Test Response:", JSON.stringify(response.data, null, 2));
        if (response.data.errors) {
            console.error("Errors found:", response.data.errors);
            process.exit(1);
        }
        if (!response.data.data.products) {
            console.error("No products returned");
            process.exit(1);
        }
        console.log("Test Passed!");
    } catch (error) {
        console.error("Error testing GraphQL:", error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
}

testGraphQL();
