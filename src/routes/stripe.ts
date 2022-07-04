import Router from "express-promise-router";
import Stripe from "stripe";

const s = Router();

const stripe = new Stripe(process.env.SECRET_KEY as string, {
  apiVersion: "2020-08-27",
});

const calculateOrderAmount = (items: any) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};

s.post("/create-payment-intent", async (req: any, res: any) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 100,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

s.post("/payment-sheet", async (req, res) => {
  let customerId;
  if (req.body.customerId) {
    customerId = req.body.customerId;
  } else {
    const customer = await stripe.customers.create();
    customerId = customer.id;
  }

  // Use an existing Customer ID if this is a returning customer.
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2020-08-27" }
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: "usd",
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customerId,
  });
});

export default s;
