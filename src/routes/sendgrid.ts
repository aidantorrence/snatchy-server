import Router from "express-promise-router";
import sgMail from "@sendgrid/mail";
import { calculateOrderAmount } from "./stripe";
const sendGrid = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

sendGrid.post("/order-confirmation", async (req, res) => {
  let { currentUser, listing, offer } = req.body;

  // different flow when order is confirmed from offer page
  if (offer) {
    currentUser = await prisma.user.findUnique({
      where: {
        uid: offer.buyerId,
      },
    });
    listing = await prisma.listing.findUnique({
      where: {
        id: offer.listingId,
      },
      include: {
        owner: true,
      },
    });
    listing.price = offer.price;
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const messages = [
      {
        to: currentUser.email,
        from: "instaheat@instaheat.co", // Change to your verified sender
        dynamicTemplateData: {
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          address: currentUser.address,
          optionalAddress: currentUser.optionalAddress,
          city: currentUser.city,
          state: currentUser.state,
          zipcode: currentUser.zipcode,
          url: listing.images[0],
          name: listing.name,
          price: listing.price,
          size: listing.size,
          total: calculateOrderAmount([listing]),
          gender: listing.gender[0],
        },
        templateId: "d-bb442e4b8d094cfaacfb676babb58a54",
      },
      {
        to: listing.owner.email,
        from: "instaheat@instaheat.co", // Change to your verified sender
        dynamicTemplateData: {
          firstName: listing.owner.firstName,
          buyerFirstName: currentUser.firstName,
          buyerLastName: currentUser.lastName,
          address: "417 Juniper Leaf Way",
          city: "Greer",
          state: "SC",
          zipcode: "29651",
          url: listing.images[0],
          name: listing.name,
          price: listing.price,
          size: listing.size,
          gender: listing.gender[0],
        },
        templateId: "d-20a5a6310e284d97b1f024b6f8c9c7e6",
      },
    ];
    await sgMail.send(messages);
    res.status(200).send("success");
  } catch (e) {
    console.log(e);
    res.status(400).send("failed");
  }
});
sendGrid.post("/offer-created", async (req, res) => {
  const { listing, price } = req.body;
  listing.price = price;
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const messages = [
      {
        to: listing.owner.email,
        from: "instaheat@instaheat.co", // Change to your verified sender
        dynamicTemplateData: {
          url: listing.images[0],
          firstName: listing.owner.firstName,
          name: listing.name,
          price: listing.price,
          size: listing.size,
          total: calculateOrderAmount([listing]),
          gender: listing.gender[0],
        },
        templateId: "d-1eacd4f741b943c7ba2f1c150a540788",
      },
    ];
    await sgMail.send(messages);
    res.status(200).send("success");
  } catch (e) {
    console.log(e);
    res.status(400).send("failed");
  }
});

sendGrid.post("/trade-created", async (req, res) => {
  const {
    sellerId,
    sellerListings,
    buyerListings,
    additionalFundsBuyer,
    additionalFundsSeller,
  } = req.body;
  const seller = await prisma.user.findUnique({
    where: {
      uid: sellerId,
    },
  });
  const yourItems = sellerListings.map((listing: any) => {
    return {
      url: listing.images[0],
      name: listing.name,
      price: listing.price,
      size: listing.size,
      gender: listing.gender[0],
    };
  });
  const theirItems = buyerListings.map((listing: any) => {
    return {
      url: listing.images[0],
      name: listing.name,
      price: listing.price,
      size: listing.size,
      gender: listing.gender[0],
    };
  });
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const messages = [
      {
        to: seller?.email,
        from: "instaheat@instaheat.co", // Change to your verified sender
        dynamicTemplateData: {
          yourItems,
          theirItems,
          additionalFundsBuyer,
          additionalFundsSeller,
          firstName: seller?.firstName,
        },
        templateId: "d-e8f4c98af6734be6af1f1fd2b10437e7",
      },
    ];
    await sgMail.send(messages);
    res.status(200).send("success");
  } catch (e) {
    console.log(e);
    res.status(400).send("failed");
  }
});
sendGrid.post("/trade-declined", async (req, res) => {
  const { trade } = req.body;
  const { Buyer, tradeListings, additionalFundsBuyer, additionalFundsSeller } =
    trade;
  const theirItems = tradeListings
    .filter((listing: any) => listing.direction === "SELLER")
    .map((listing: any) => {
      const { Listing } = listing;
      return {
        url: Listing.images[0],
        name: Listing.name,
        price: Listing.price,
        size: Listing.size,
        gender: Listing.gender[0],
      };
    });
  const yourItems = tradeListings
    .filter((listing: any) => listing.direction === "BUYER")
    .map((listing: any) => {
      const { Listing } = listing;
      return {
        url: Listing.images[0],
        name: Listing.name,
        price: Listing.price,
        size: Listing.size,
        gender: Listing.gender[0],
      };
    });
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const messages = [
      {
        to: Buyer?.email,
        from: "instaheat@instaheat.co", // Change to your verified sender
        dynamicTemplateData: {
          yourItems,
          theirItems,
          additionalFundsBuyer,
          additionalFundsSeller,
          firstName: Buyer?.firstName,
        },
        templateId: "d-996ffecc769b433fa4dcd66aaaf0d967",
      },
    ];
    await sgMail.send(messages);
    res.status(200).send("success");
  } catch (e) {
    console.log(e);
    res.status(400).send("failed");
  }
});
sendGrid.post("/trade-confirmation", async (req, res) => {
  const { trade } = req.body;
  const {
    Buyer,
    Seller,
    tradeListings,
    additionalFundsBuyer,
    additionalFundsSeller,
  } = trade;
  const sellerItems = tradeListings
    .filter((listing: any) => listing.direction === "SELLER")
    .map((listing: any) => {
      const { Listing } = listing;
      return {
        url: Listing.images[0],
        name: Listing.name,
        price: Listing.price,
        size: Listing.size,
        gender: Listing.gender[0],
      };
    });
  const buyerItems = tradeListings
    .filter((listing: any) => listing.direction === "BUYER")
    .map((listing: any) => {
      const { Listing } = listing;
      return {
        url: Listing.images[0],
        name: Listing.name,
        price: Listing.price,
        size: Listing.size,
        gender: Listing.gender[0],
      };
    });
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const messages = [
      {
        to: Seller?.email,
        from: "instaheat@instaheat.co",
        dynamicTemplateData: {
          yourItems: sellerItems,
          theirItems: buyerItems,
          yourAdditionalFunds: additionalFundsSeller,
          theirAdditionalFunds: additionalFundsBuyer,
          firstName: Seller?.firstName,
          address: "417 Juniper Leaf Way",
          city: "Greer",
          state: "SC",
          zipcode: "29651",
        },
        templateId: "d-0dfd624cefbd4174af5d93d3567af0c1",
      },
      {
        to: Buyer?.email,
        from: "instaheat@instaheat.co",
        dynamicTemplateData: {
          yourItems: buyerItems,
          theirItems: sellerItems,
          yourAdditionalFunds: additionalFundsBuyer,
          theirAdditionalFunds: additionalFundsSeller,
          firstName: Buyer?.firstName,
          address: "417 Juniper Leaf Way",
          city: "Greer",
          state: "SC",
          zipcode: "29651",
        },
        templateId: "d-0dfd624cefbd4174af5d93d3567af0c1",
      },
    ];
    await sgMail.send(messages);
    res.status(200).send("success");
  } catch (e) {
    console.log(e);
    res.status(400).send("failed");
  }
});

sendGrid.post("/offer-declined", async (req, res) => {
  const { offer } = req.body;
  const { listing } = offer;

  const buyer = await prisma.user.findUnique({
    where: {
      uid: offer.buyerId,
    },
  });

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const messages = [
      {
        to: buyer?.email,
        from: "instaheat@instaheat.co", // Change to your verified sender
        dynamicTemplateData: {
          url: listing.images[0],
          firstName: buyer?.firstName,
          name: listing.name,
          price: offer.price,
          size: listing.size,
          gender: listing.gender[0],
        },
        templateId: "d-de43c2c14dab4ce58bd88a5753274cb1",
      },
    ];
    await sgMail.send(messages);
    res.status(200).send("success");
  } catch (e) {
    console.log(e);
    res.status(400).send("failed");
  }
});

export default sendGrid;
