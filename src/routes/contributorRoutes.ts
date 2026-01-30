import { Router, RequestHandler } from "express";
import { ContributorController } from "../controllers/contributorController";
import {
    repositoryAnalysisRateLimit,
    issueFetchRateLimit,
} from "../middleware/rateLimitMiddleware";
import { StakeController } from "../controllers/stakeController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

const contributorController = new ContributorController();

const stakeController = new StakeController();

router.post(
    "/analyze-repositories",
    authMiddleware as RequestHandler,
    repositoryAnalysisRateLimit,
    contributorController.analyzeUserRepositories as RequestHandler
);

router.post(
    "/suggested-issues",
    authMiddleware as RequestHandler,
    issueFetchRateLimit,
    contributorController.getSuggestedIssues as RequestHandler
);

router.get("/issue-details/:issueId", authMiddleware as RequestHandler, contributorController.getIssueDetails as RequestHandler);

router.post("/stakes", authMiddleware as RequestHandler, stakeController.createStake as RequestHandler);
router.patch("/stakes/:stakesId", authMiddleware as RequestHandler, stakeController.updateStakeStatus as RequestHandler);
router.get("/stakes", authMiddleware as RequestHandler, stakeController.getUserStakes as RequestHandler);
router.post("/profile", authMiddleware as RequestHandler, contributorController.getContributorProfile as RequestHandler);
router.post("/prepare-stakes", authMiddleware as RequestHandler, contributorController.prepareStake as RequestHandler);

export default router;