import Router from "express-promise-router";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const trades = Router();

trades.post("/trade", async (req, res) => {
  const { buyerId, owner, buyerListings, sellerListings, additionalFundsBuyer, additionalFundsSeller } = req.body;
  try {
    const trade = await prisma.trade.create({
      data: {
        buyerId,
        sellerId: owner.id,
        additionalFundsBuyer,
        additionalFundsSeller,
        Buyer: {
          connect: {
            id: buyerId,
          },
        },
        Seller: {
          connect: {
            id: owner.id,
          },
        },
        tradeListings: {
          create: [
            ...buyerListings.map((listing: any) => ({
              listing: {
                connect: {
                  id: listing.id,
                },
              },
              direction: "BUYER",
            })),
            ...sellerListings.map((listing: any) => ({
              listing: {
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

// const assignCategories = await prisma.post.create({
//   data: {
//     title: 'How to be Bob',
//     categories: {
//       create: [
//         {
//           assignedBy: 'Bob',
//           assignedAt: new Date(),
//           category: {
//             connect: {
//               id: 9,
//             },
//           },
//         },
//         {
//           assignedBy: 'Bob',
//           assignedAt: new Date(),
//           category: {
//             connect: {
//               id: 22,
//             },
//           },
//         },
//       ],
//     },
//   },
// })
