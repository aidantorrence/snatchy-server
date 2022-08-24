import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const offers = Router();

offers.post("/offer", async (req, res) => {
  const { buyerId, listing, price } = req.body;
  try {
    const offer = await prisma.offer.create({
      data: {
        buyerId,
        listingId: listing.id,
        sellerId: listing.ownerId,
        price,
      },
    });
    res.status(200).send(offer);
  } catch (e) {
    console.log(e);
    res.status(400).send("offer failed");
  }
});
offers.patch("/offer", async (req, res) => {
  const { id } = req.body;
  try {
    const data = await prisma.offer.update({
      where: {
        id,
      },
      data: req.body,
    });
    res.status(200).send(data);
  } catch (e) {
    console.log(e);
    res.status(400).send("offer update failed");
  }
});

offers.get("/offers", async (req, res) => {
  try {
    const user = await prisma.user.findMany();
    res.json(offers);
  } catch (e) {
    console.log(e);
    res.json(e);
  }
});
offers.get("/offers/:uid", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        uid: req.params.uid,
      },
      include: {
        BuyerOffers: {
          where: {
            accepted: false,
            cancelled: false,
            listing: {
              sold: false,
            }
          },
          include: {
            listing: true,
          },
        },
        SellerOffers: {
          where: {
            accepted: false,
            cancelled: false,
            listing: {
              sold: false,
            }
          },
          include: {
            listing: true,
          },
        },
      },
    });
    res.json(user);
  } catch (e) {
    res.json(e);
  }
});

export default offers;
