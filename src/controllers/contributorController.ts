// src/controllers/contributorController.ts
import { Request, Response } from "express";
import User from "../model/User";

export class ContributorController {
  /**
   * GET /api/contributor/profile/:userId
   * Get contributor profile by user ID
   */
  public getContributorProfile = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select("-password");
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      console.log("📋 Profile/:userId request for:", user.githubUsername);
      console.log("🔑 Has accessToken:", !!user.accessToken);
      console.log("📦 Has stored githubInfo:", !!user.githubInfo);

      // Default githubInfo structure
      let githubInfo: any = {
        name: user.githubUsername,
        bio: null,
        location: null,
        company: null,
        avatar_url: `https://github.com/${user.githubUsername}.png`,
        html_url: `https://github.com/${user.githubUsername}`,
        blog: null,
        twitter_username: null,
        public_repos: 0,
        followers: 0,
        following: 0,
      };

      // First, try to use stored githubInfo from database (saved during OAuth)
      if (user.githubInfo) {
        try {
          const storedInfo = JSON.parse(user.githubInfo);
          console.log("✅ Using stored githubInfo:", storedInfo);
          githubInfo = {
            ...githubInfo,
            ...storedInfo,
            avatar_url: storedInfo.avatar_url || githubInfo.avatar_url,
          };
        } catch (e) {
          console.error("Failed to parse stored githubInfo:", e);
        }
      }

      // If no stored info, fetch from GitHub API
      if (!user.githubInfo && user.accessToken && user.githubUsername) {
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
            const githubProfile = await githubRes.json();
            console.log("✅ Fresh GitHub profile fetched:", githubProfile.bio);
            githubInfo = {
              name: githubProfile.name || user.githubUsername,
              bio: githubProfile.bio || null,
              location: githubProfile.location || null,
              company: githubProfile.company || null,
              avatar_url:
                githubProfile.avatar_url ||
                `https://github.com/${user.githubUsername}.png`,
              html_url:
                githubProfile.html_url ||
                `https://github.com/${user.githubUsername}`,
              blog: githubProfile.blog || null,
              twitter_username: githubProfile.twitter_username || null,
              public_repos: githubProfile.public_repos || 0,
              followers: githubProfile.followers || 0,
              following: githubProfile.following || 0,
            };
          } else {
            console.error("GitHub API error:", githubRes.status);
          }
        } catch (err) {
          console.error("Failed to fetch GitHub profile:", err);
        }
      }

      // Response structure matching ContributorSettings.tsx expectations
      res.status(200).json({
        success: true,
        data: {
          profile: {
            id: user._id,
            email: user.email,
            githubUsername: user.githubUsername,
            githubInfo,
            profile: {
              name: githubInfo.name,
              bio: githubInfo.bio,
            },
            coins: user.coins || 0,
            xp: user.xp || 0,
            rank: user.rank || "Code Novice",
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching contributor profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
        error: error.message,
      });
    }
  };

  /**
   * POST /api/contributor/analyze-repositories
   * Analyze repositories for a contributor
   */
  public analyzeUserRepositories = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { userId, repositories } = req.body;

      // TODO: Implement full repository analysis with GitHub API
      // For now, return a placeholder response
      res.status(200).json({
        success: true,
        message: "Repository analysis completed",
        data: {
          repositories: repositories || [],
          suggestedIssues: [],
        },
      });
    } catch (error: any) {
      console.error("Error analyzing repositories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to analyze repositories",
        error: error.message,
      });
    }
  };

  /**
   * POST /api/contributor/suggested-issues
   * Get suggested issues for a contributor
   */
  public getSuggestedIssues = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { userId, skills } = req.body;

      // TODO: Implement AI-powered issue suggestions
      // For now, return a placeholder response
      res.status(200).json({
        success: true,
        message: "Issues fetched successfully",
        data: [],
      });
    } catch (error: any) {
      console.error("Error fetching suggested issues:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch suggested issues",
        error: error.message,
      });
    }
  };

  /**
   * GET /api/contributor/issue-details/:issueId
   * Get issue details
   */
  public getIssueDetails = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { issueId } = req.params;

      // TODO: Fetch issue details from GitHub API
      res.status(200).json({
        success: true,
        message: "Issue details fetched",
        data: {
          issueId,
          title: "Issue placeholder",
          description: "This is a placeholder",
        },
      });
    } catch (error: any) {
      console.error("Error fetching issue details:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch issue details",
        error: error.message,
      });
    }
  };

  /**
   * POST /api/contributor/prepare-stake
   * Prepare a stake for an issue
   */
  public prepareStake = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, issueId, amount } = req.body;

      res.status(200).json({
        success: true,
        message: "Stake prepared",
        data: {
          userId,
          issueId,
          amount,
          ready: true,
        },
      });
    } catch (error: any) {
      console.error("Error preparing stake:", error);
      res.status(500).json({
        success: false,
        message: "Failed to prepare stake",
        error: error.message,
      });
    }
  };
}
