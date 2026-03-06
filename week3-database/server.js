const express = require("express");
const mongoose = require("mongoose");
const { type } = require("os");
const app = express();
const PORT = 3000;
const MONGO_URI =
  "mongodb://admin:secret@localhost:27017/testapp?authSource=admin";

app.use(express.json());
// let accounts = [];

// 1 - create account - post
// 2 - get all accounts - get
// 3- deposit - post
// 4 - withdraw - post
// 5 - transfer - post
// 6 - delete an account
// {
// id: string
// name: string
// balance: int
// }
const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
});
const Account = mongoose.model("Account", accountSchema);

app.post("/accounts", async (req, res) => {
  const { name, initBalance } = req.body;
  //   const account = {
  //     id: Date.now().toString(),
  //     name,
  //     balance: initBalance,
  //   };
  //   accounts.push(account);
  const account = await Account.create({
    name,
    balance: initBalance,
  });
  res.status(201).json(account);
});
app.get("/accounts", async (req, res) => {
  const accounts = await Account.find();
  res.json(accounts);
});

app.post("/accounts/:id/deposit", async (req, res) => {
  const { amount } = req.body;
  const id = req.params.id;
  console.log("herer");

  const account = await Account.findById(id);
  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  account.balance += amount;
  await account.save();
  res.json(account);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("conncted to db");
    app.listen(PORT, () => {
      console.log(`listening on port:${PORT}`);
    });
  } catch (error) {
    console.error("failed with", error.message);
  }
}
start();
