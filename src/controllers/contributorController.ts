import { Request, Response } from "express";
import { GitHubService } from "../services/githubService";
import User from "../model/User";

export class ContributorController {
    private githubService: GitHubService;

    constructor() {
        this.githubService = new GitHubService();
    }

    public getContributorProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const { accessToken } = req.body;
            const userId = (req as any).user?.id || (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({ success: false, message: "User not authenticated" });
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }

            // If we have an accessToken, we can fetch fresh GitHub info
            // For now, return what we have in the DB + some defaults
            res.json({
                success: true,
                data: {
                    profile: {
                        login: user.githubUsername,
                        name: user.profile?.name || user.githubUsername,
                        avatar_url: "", // Should be in githubInfo
                        public_repos: 0,
                    },
                    stats: {
                        coins: user.coins,
                        xp: user.xp,
                        rank: user.rank,
                        nextRankXP: user.xpForNextRank(),
                        repositories: 0,
                        mergedPRs: 0,
                        activeBounties: 0,
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    };

    public analyzeUserRepositories = async (req: Request, res: Response): Promise<void> => {
        try {
            const { accessToken } = req.body;
            if (!accessToken) {
                res.status(400).json({ success: false, message: "Access token required" });
                return;
            }

            // Logic to analyze repositories using GitHubService
            res.json({ success: true, message: "Repositories analyzed successfully" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    };

    public getSuggestedIssues = async (req: Request, res: Response): Promise<void> => {
        try {
            const { accessToken } = req.body;
            // Use GitHubService to find issues
            res.json({ success: true, data: { issues: [] } });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
}
