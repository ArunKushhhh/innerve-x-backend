import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken";
import { ContributorController } from "../controllers/contributorController";
import { StakeController } from "../controllers/stakeController";

const router = Router();
router.use(verifyToken);

const contributorController = new ContributorController();
const stakeController = new StakeController();

router.post("/analyze-repositories", contributorController.analyzeUserRepositories);
router.post("/suggested-issues", contributorController.getSuggestedIssues);
router.post("/profile", contributorController.getContributorProfile);

router.post("/stakes", stakeController.createStake);
router.patch("/stakes/:stakesId", stakeController.updateStakeStatus);
router.get("/stakes", stakeController.getUserStakes);

export default router;