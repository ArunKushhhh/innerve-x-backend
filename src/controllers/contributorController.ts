import { Request, Response } from "express";
import User from "../model/User";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class ContributorController {

    public getContributorProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }

            let profileData = {};
            if (user.githubInfo) {
                try {
                    profileData = JSON.parse(user.githubInfo);
                } catch (e) {
                    console.error("Failed to parse githubInfo", e);
                }
            }

            res.status(200).json({
                success: true,
                data: {
                    profile: {
                        ...profileData,
                        name: user.profile?.name || (profileData as any).name || user.githubUsername,
                        bio: user.profile?.bio || (profileData as any).bio || "No bio available",
                        // augment with DB profile if needed
                    },
                    stats: {
                        coins: user.coins,
                        xp: user.xp,
                        rank: user.rank,
                        nextRankXP: user.xpForNextRank ? (user.xpForNextRank() + (user.xp || 0)) : 100 // simplified
                    },
                    // Return GitHub token if needed by frontend for direct API calls
                    githubToken: user.accessToken
                }
            });
        } catch (error: any) {
            console.error("Get profile error:", error);
            res.status(500).json({ success: false, message: "Failed to fetch profile", error: error.message });
        }
    };

    public analyzeUserRepositories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        // Mock implementation or valid logic
        try {
            res.status(200).json({ success: true, message: "Analysis started" });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    public getSuggestedIssues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        // Mock implementation
        try {
            res.status(200).json({ success: true, data: { issues: [] } });
        } catch (err: any) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    public getIssueDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        // Mock implementation
        res.status(200).json({ success: true, data: {} });
    }

    public prepareStake = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        // Mock implementation
        res.status(200).json({ success: true, message: "Stake prepared" });
    }

}
