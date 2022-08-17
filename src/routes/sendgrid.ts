import Router from "express-promise-router";
import sgMail from "@sendgrid/mail";
import { calculateOrderAmount } from "./stripe";
const sendGrid = Router();

sendGrid.post("/orderConfirmation", async (req, res) => {
  const { currentUser, listing } = req.body;
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const messages = [
      {
        to: "aidan.torrence@gmail.com", // Change to your currentUser.email
        from: "aidan.torrence@gmail.com", // Change to your verified sender
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
        to: "aidan.torrence@gmail.com", // Change to listing.owner.email
        from: "aidan.torrence@gmail.com", // Change to your verified sender
        dynamicTemplateData: {
          firstName: listing.owner.firstName,
          buyerFirstName: currentUser.firstName,
          buyerLastName: currentUser.lastName,
          address: currentUser.address,
          optionalAddress: currentUser.optionalAddress,
          city: currentUser.city,
          state: currentUser.state,
          zipcode: currentUser.zipcode,
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

export default sendGrid;
