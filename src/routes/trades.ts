import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const trades = Router();

trades.post("/trade", async (req, res) => {
  const {
    buyerId,
    sellerId,
    buyerListings,
    sellerListings,
    additionalFundsBuyer,
    additionalFundsSeller,
  } = req.body;
  try {
    const trade = await prisma.trade.create({
      data: {
        additionalFundsBuyer,
        additionalFundsSeller,
        Buyer: {
          connect: {
            uid: buyerId,
          },
        },
        Seller: {
          connect: {
            uid: sellerId,
          },
        },
        tradeListings: {
          create: [
            ...buyerListings.map((listing: any) => ({
              Listing: {
                connect: {
                  id: listing.id,
                },
              },
              direction: "BUYER",
            })),
            ...sellerListings.map((listing: any) => ({
              Listing: {
                connect: {
                  id: listing.id,
                },
              },
              direction: "SELLER",
            })),
          ],
        },
      },
    });
    res.status(200).send(trade);
  } catch (e) {
    console.log(e);
    res.status(400).send("trade failed");
  }
});

trades.get("/trades/:uid", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        uid: req.params.uid,
      },
      include: {
        BuyerTrades: {
          where: {
            accepted: false,
            cancelled: false,
          },
          include: {
            tradeListings: {
              include: {
                Listing: true,
              }
            },
            Seller: true,
            Buyer: true,
          },
        },
        SellerTrades: {
          where: {
            accepted: false,
            cancelled: false,
          },
          include: {
            tradeListings: {
              include: {
                Listing: true,
              }
            },
            Seller: true,
            Buyer: true,
          },
        },
      },
    });
    res.json(user);
  } catch (e) {
    res.json(e);
  }
});

trades.patch("/trade", async (req, res) => {
  const { id } = req.body;
  try {
    const data = await prisma.trade.update({
      where: {
        id,
      },
      data: req.body,
    });
    res.status(200).send(data);
  } catch (e) {
    console.log(e);
    res.status(400).send("trade update failed");
  }
});

export default trades;
