const express = require("express");
const app = express();

const users = [
  { id: 1, name: "Alice" }, // 0
  { id: 2, name: "Bob" }, // 1
  { id: 3, name: "Charlie" }, // 2
];

function sayHello(req, res) {
  res.send("Hello, World!");
}
app.get("/", sayHello);
app.get("/users", (req, res) => {
  res.json(users);
});
app.get("/users/:id", (req, res) => {
  const userId = Number.parseInt(req.params.id);
  const user = users.find((u) => u.id === userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});
app.post("/users", (req, res) => {
  const newUser = {
    id: users.length + 1, // 4
    name: `User${users.length + 1}`, // User4
  };
  users.push(newUser);
  res.status(201).json(newUser);
});
app.put("/users/:id", (req, res) => {
  const userId = Number.parseInt(req.params.id); // NaN
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
  } else {
    const updatedUser = {
      id: userId,
      name: `UpdatedUser${userId}`,
    };
    users[userIndex] = updatedUser;
    res.json(updatedUser); // 200 OK
  }
});
app.delete("/users/:id", (req, res) => {
  const userId = Number.parseInt(req.params.id);
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
  } else {
    const deletedUserArray = users.splice(userIndex, 1);
    const deletedUser = deletedUserArray[0];
    res.json(deletedUser);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
