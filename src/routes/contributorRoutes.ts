// src/routes/contributorRoutes.ts
import { Router } from "express";
import { ContributorController } from "../controllers/contributorController";
import {
  repositoryAnalysisRateLimit,
  issueFetchRateLimit,
} from "../middleware/rateLimitMiddleware";
import { StakeController } from "../controllers/stakeController";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

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
router.get("/stakes", (req, res) =>
  stakeController.getUserStakes(req as AuthenticatedRequest, res),
);
router.post("/stakes", (req, res) =>
  stakeController.createStake(req as AuthenticatedRequest, res),
);
router.patch("/stakes/:stakeId", (req, res) =>
  stakeController.updateStakeStatus(req as AuthenticatedRequest, res),
);

// Prepare stake
router.post("/prepare-stake", contributorController.prepareStake);

export default router;
