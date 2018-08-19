const express = require("express");
const router = express.Router();
const _ = require("lodash");
const validate = require("../middleware/validate");
const { check } = require("express-validator/check");
const itemStore = require("../datastore/item");

router.get("/", async (req, res) => {
  const items = await itemStore.getAllByUserId(req.identity.userId);
  res.send(items);
});

router.get("/:id", async (req, res) => {
  const item = await itemStore.getById(req.params.id);
  if (!item) {
    return res.sendStatus(404);
  }
  if (item.userId !== req.identity.userId) {
    return res.sendStatus(404);
  }

  res.send(item);
});

router.put(
  "/:id",
  [
    check("subject")
      .not()
      .isEmpty()
      .withMessage("Subject is required"),
    validate
  ],
  async (req, res) => {
    const item = await itemStore.getById(req.params.id);
    if (!item) {
      return res.sendStatus(404);
    }
    if (item.userId !== req.identity.userId) {
      return res.sendStatus(404);
    }

    await itemStore.save(
      Object.assign(item, _.pick(req.body, ["subject", "description"]))
    );
    res.send(item);
  }
);

router.post(
  "/",
  [
    check("subject")
      .not()
      .isEmpty()
      .withMessage("Subject is required"),
    validate
  ],
  async (req, res) => {
    const item = await itemStore.save(
      Object.assign(
        { userId: req.identity.userId },
        _.pick(req.body, ["subject", "description"])
      )
    );

    res.send(item);
  }
);

router.delete("/:id", async (req, res) => {
  const item = await itemStore.getById(req.params.id);
  if (!item) {
    return res.sendStatus(404);
  }
  if (item.userId !== req.identity.userId) {
    return res.sendStatus(404);
  }

  await itemStore.remove(req.params.id);
  res.send(req.params.id);
});

module.exports = router;
