// src/routes/contributorRoutes.ts
import { Router } from "express";
import { ContributorController } from "../controllers/contributorController";
import {
  repositoryAnalysisRateLimit,
  issueFetchRateLimit,
} from "../middleware/rateLimitMiddleware";
import { StakeController } from "../controllers/stakeController";

const router = Router();

const contributorController = new ContributorController();
const stakeController = new StakeController();

// Repository analysis
router.post(
  "/analyze-repositories",
  repositoryAnalysisRateLimit,
  contributorController.analyzeUserRepositories,
);

// Get suggested issues
router.post(
  "/suggested-issues",
  issueFetchRateLimit,
  contributorController.getSuggestedIssues,
);

// Get issue details
router.get("/issue-details/:issueId", contributorController.getIssueDetails);

// Profile
router.get("/profile/:userId", contributorController.getContributorProfile);

// Stakes
router.get("/stakes", stakeController.getUserStakes);
router.post("/stakes", stakeController.createStake);
router.patch("/stakes/:stakeId", stakeController.updateStakeStatus);

// Prepare stake
router.post("/prepare-stake", contributorController.prepareStake);

export default router;
