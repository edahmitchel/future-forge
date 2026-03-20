const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// NOTE: This is one routing approach
// userRouter.get("/", (req, res) => {});
// userRouter.get("/:id", (req, res) => {});
// userRouter.post("/", (req, res) => {});
// userRouter.put("/:id", (req, res) => {});
// userRouter.delete("/:id", (req, res) => {});

// OR

// We could use an MVRC (model-view-route-controller) approach
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.validateUser, userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .put(userController.validateUser, userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
