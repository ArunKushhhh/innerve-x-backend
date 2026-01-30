"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyToken_1 = require("../middleware/verifyToken");
const contributorController_1 = require("../controllers/contributorController");
const stakeController_1 = require("../controllers/stakeController");
const router = (0, express_1.Router)();
router.use(verifyToken_1.verifyToken);
const contributorController = new contributorController_1.ContributorController();
const stakeController = new stakeController_1.StakeController();
router.post("/analyze-repositories", contributorController.analyzeUserRepositories);
router.post("/suggested-issues", contributorController.getSuggestedIssues);
router.post("/profile", contributorController.getContributorProfile);
router.post("/stakes", stakeController.createStake);
router.patch("/stakes/:stakesId", stakeController.updateStakeStatus);
router.get("/stakes", stakeController.getUserStakes);
exports.default = router;
//# sourceMappingURL=contributorRoutes.js.map