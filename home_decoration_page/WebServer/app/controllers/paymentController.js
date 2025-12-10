exports.validatePayment = (req, res) => {
    const { cardNumber, expiry, cvc, name } = req.body;

    console.log("Payment Request Received:", { cardNumber, expiry, cvc, name }); // DEBUG LOG

    if (!cardNumber || !expiry || !cvc || !name) {
        console.log("Missing fields");
        return res.status(400).send({ message: "All payment fields are required." });
    }

    // 1. Validate Card Number (Simple Luhn Algorithm Check)
    // Remove spaces/dashes
    const saneCardNum = cardNumber.replace(/[\s-]/g, "");
    if (!/^\d{16}$/.test(saneCardNum)) {
        console.log("Invalid format:", saneCardNum);
        return res.status(400).send({ message: "Invalid card number format. Must be 16 digits." });
    }

    // Luhn Check (Simplified for demo, or real depending on requirements)
    // For this project "main priority is api", so let's do a real Luhn check.
    let sum = 0;
    let shouldDouble = false;
    for (let i = saneCardNum.length - 1; i >= 0; i--) {
        let digit = parseInt(saneCardNum.charAt(i));
        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    if (sum % 10 !== 0) {
        console.log("Luhn check failed for:", saneCardNum, "Sum:", sum);
        return res.status(400).send({ message: "Invalid card number (LUHN check failed)." });
    }


    // 2. Validate Expiry (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        console.log("Invalid expiry format:", expiry);
        return res.status(400).send({ message: "Invalid expiry format. Use MM/YY." });
    }

    const [expMonth, expYear] = expiry.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Last 2 digits
    const currentMonth = now.getMonth() + 1;

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        console.log("Expired card:", expMonth, expYear);
        return res.status(400).send({ message: "Card has expired." });
    }

    // 3. Validate CVC
    if (!/^\d{3,4}$/.test(cvc)) {
        console.log("Invalid CVC:", cvc);
        return res.status(400).send({ message: "Invalid CVC. Must be 3 or 4 digits." });
    }

    // If all pass
    res.status(200).send({
        message: "Payment validated successfully.",
        transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase()
    });
};
