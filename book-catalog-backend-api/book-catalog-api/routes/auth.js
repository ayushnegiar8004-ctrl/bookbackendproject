const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { registerRules, loginRules, validate } = require("../middleware/validators");

router.post("/register", registerRules, validate, register);
router.post("/login",    loginRules,    validate, login);
router.get("/me",        protect,               getMe);

module.exports = router;
