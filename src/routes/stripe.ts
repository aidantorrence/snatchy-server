import { PrismaClient } from "@prisma/client";
import Router from "express-promise-router";
import Stripe from "stripe";

const s = Router();
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.SECRET_KEY as string, {
  apiVersion: "2020-08-27",
});

export const calculateOrderAmount = (items: any) => {
  const subtotal = items.reduce((acc: number, item: any) => {
    return acc + item.price;
  }, 0);
  const total = subtotal * 1.0725 + 20;
  return Math.round(total * 100);
};

s.post("/create-account", async (req, res) => {
  const { uid } = req.body;
  let account: any;
  const user = await prisma.user.findUnique({
    where: {
      uid,
    },
  });
  if (user?.chargesEnabled) {
    res.send({
      accountLink: undefined,
      accountId: user?.accountId,
    });
    return;
  }
  if (!user?.accountId) {
    account = await stripe.accounts.create({ type: "express" });
    const data = await prisma.user.update({
      where: {
        uid,
      },
      data: {
        accountId: account.id,
      },
    });
  }
  const accountLink = await stripe.accountLinks.create({
    account: user?.accountId || account?.id,
    refresh_url: "https://instaheat-server.herokuapp.com/redirect",
    return_url: "https://instaheat-server.herokuapp.com/redirect",
    type: "account_onboarding",
  });
  res.send({
    accountLink: accountLink.url,
    accountId: user?.accountId || account?.id,
  });
});

s.get("/account-status/:accountId", async (req, res) => {
  const { accountId } = req.params;
  if (!accountId) {
    res.status(400).send("accountId not provided");
  }
  const account = await stripe.accounts.retrieve(accountId);
  const data = await prisma.user.update({
    where: {
      accountId,
    },
    data: {
      chargesEnabled: account.charges_enabled,
    },
  });
  res.send(account);
});

s.get("/redirect", async (req, res) => {
  res
    .status(301)
    .redirect("exp://ya-b6f.aidantorrence.instaheat.exp.direct:80");
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
  if (!listingIds) {
    res.status(400).send("listingIds not provided");
  }
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

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2020-08-27" }
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentAmount,
    currency: "usd",
    customer: customerId,
    payment_method: paymentMethods.data.length
      ? paymentMethods.data[0].id
      : undefined,
    // setup_future_usage: "off_session",
    automatic_payment_methods: {
      enabled: true,
    },
    application_fee_amount: Math.round(paymentAmount * 0.07),
    transfer_data: {
      destination: req.body.accountId,
    },
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customerId,
  });
});

s.post("/setup-payment", async (req, res) => {
  let customerId;
  if (req.body.customerId) {
    customerId = req.body.customerId;
  } else {
    const customer = await stripe.customers.create();
    customerId = customer.id;
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  if (paymentMethods.data.length) {
    res.json({
      paymentMethod: paymentMethods.data[0].id,
    });
    return;
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2020-08-27" }
  );

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
  });

  res.json({
    setupIntent: setupIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customerId,
  });
});

s.post("/charge-offer", async (req, res) => {
  const offer = req.body;

  const listing = await prisma.listing.findUnique({
    where: {
      id: offer.listingId,
    },
  });

  if (listing?.sold) {
    res.status(400).send("listing already sold");
    return;
  }

  const buyer = await prisma.user.findUnique({
    where: {
      uid: offer.buyerId,
    },
  });

  const seller = await prisma.user.findUnique({
    where: {
      uid: offer.sellerId,
    },
  });

  const paymentMethods = await stripe.paymentMethods.list({
    customer: buyer?.customerId || undefined,
    type: "card",
  });

  const paymentAmount = calculateOrderAmount([offer]);
  const paymentIntent = await stripe.paymentIntents.create({
    customer: buyer?.customerId || undefined,
    amount: paymentAmount,
    currency: "usd",
    payment_method: paymentMethods.data[0].id,
    application_fee_amount: Math.round(paymentAmount * 0.07),
    transfer_data: {
      destination: seller?.accountId || "",
    },
    off_session: true,
    confirm: true,
  });
  await prisma.listing.update({
    where: {
      id: offer.listingId,
    },
    data: {
      sold: true,
    },
  });
  res.send({
    paymentIntent: paymentIntent.client_secret,
  });
});

export default s;
