// src/routes/contributorRoutes.ts
import { Router, Request, Response } from "express";
import { ContributorController } from "../controllers/contributorController";
import {
  repositoryAnalysisRateLimit,
  issueFetchRateLimit,
} from "../middleware/rateLimitMiddleware";
import { StakeController } from "../controllers/stakeController";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "../middleware/authMiddleware";
import User from "../model/User";

// Helper function to calculate next rank XP threshold
const getNextRankXP = (xp: number): number => {
  if (xp >= 5000) return 5000;
  if (xp >= 3000) return 5000;
  if (xp >= 1500) return 3000;
  if (xp >= 500) return 1500;
  if (xp >= 100) return 500;
  return 100;
};

const router = Router();

const contributorController = new ContributorController();
const stakeController = new StakeController();

// Apply auth middleware to all routes
router.use(authMiddleware as any);

// Get current user's profile (from JWT token) - supports both GET and POST
router.all("/profile", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id || authReq.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    console.log("📋 Profile request for user:", user.githubUsername);
    console.log("🔑 Has accessToken:", !!user.accessToken);
    console.log("📦 Has stored githubInfo:", !!user.githubInfo);

    // First, try to use stored githubInfo from database (saved during OAuth)
    let githubProfile: any = null;
    if (user.githubInfo) {
      try {
        githubProfile = JSON.parse(user.githubInfo);
        console.log("✅ Using stored githubInfo:", githubProfile);
      } catch (e) {
        console.error("Failed to parse stored githubInfo:", e);
      }
    }

    // If no stored info, fetch from GitHub API
    if (!githubProfile && user.accessToken && user.githubUsername) {
      try {
        console.log("🌐 Fetching fresh GitHub profile...");
        const githubRes = await fetch(
          `https://api.github.com/users/${user.githubUsername}`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          },
        );
        if (githubRes.ok) {
          githubProfile = await githubRes.json();
          console.log("✅ Fresh GitHub profile fetched:", githubProfile.bio);
        } else {
          console.error(
            "GitHub API error:",
            githubRes.status,
            await githubRes.text(),
          );
        }
      } catch (err) {
        console.error("Failed to fetch GitHub profile:", err);
      }
    }

    // Response structure matching frontend expectations
    res.status(200).json({
      success: true,
      data: {
        profile: {
          id: user._id,
          username: user.githubUsername,
          login: githubProfile?.login || user.githubUsername,
          name: githubProfile?.name || user.githubUsername,
          email: user.email || githubProfile?.email,
          bio: githubProfile?.bio || null,
          location: githubProfile?.location || null,
          avatar_url:
            githubProfile?.avatar_url ||
            `https://github.com/${user.githubUsername}.png`,
          html_url:
            githubProfile?.html_url ||
            `https://github.com/${user.githubUsername}`,
          blog: githubProfile?.blog || null,
          twitter_username: githubProfile?.twitter_username || null,
          company: githubProfile?.company || null,
          public_repos: githubProfile?.public_repos || 0,
          followers: githubProfile?.followers || 0,
          following: githubProfile?.following || 0,
        },
        stats: {
          coins: user.coins || 0,
          xp: user.xp || 0,
          rank: user.rank || "Code Novice",
          nextRankXP: getNextRankXP(user.xp || 0),
        },
        githubToken: user.accessToken, // User's GitHub token for API calls
      },
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

// Get profile by userId (for viewing other users)
router.get("/profile/:userId", contributorController.getContributorProfile);

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
