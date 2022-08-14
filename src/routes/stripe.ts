import { PrismaClient } from "@prisma/client";
import Router from "express-promise-router";
import Stripe from "stripe";

const s = Router();
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.SECRET_KEY as string, {
  apiVersion: "2020-08-27",
});

const calculateOrderAmount = (items: any) => {
  const subtotal = items.reduce((acc: number, item: any) => {
    return acc + item.price;
  }, 0);
  const total = subtotal * 1.0725 + 20;
  return total;
};

s.post("/create-account", async (req, res) => {
  const { uid } = req.body;
  const account = await stripe.accounts.create({ type: "express" });
  const data = await prisma.user.update({
    where: {
      uid,
    },
    data: {
      accountId: account.id,
    },
  });
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    // return_url: "exp://ya-b6f.aidantorrence.instaheat.exp.direct:80",
    type: "account_onboarding",
  });
  res.send({
    accountLink: accountLink.url,
    accountId: account.id,
  });
});

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
  const { listingIds } = req.body;
  const listings = await prisma.listing.findMany({
    where: {
      id: { in: listingIds },
    },
  });
  let customerId;
  if (req.body.customerId) {
    customerId = req.body.customerId;
  } else {
    const customer = await stripe.customers.create();
    customerId = customer.id;
  }

  const paymentAmount = calculateOrderAmount(listings);
  // Use an existing Customer ID if this is a returning customer.
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2020-08-27" }
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(paymentAmount * 100),
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
