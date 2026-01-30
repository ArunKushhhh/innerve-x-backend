"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContributorController = void 0;
const githubService_1 = require("../services/githubService");
const User_1 = __importDefault(require("../model/User"));
class ContributorController {
    constructor() {
        this.getContributorProfile = async (req, res) => {
            try {
                const { accessToken } = req.body;
                const userId = req.user?.id || req.user?.userId;
                if (!userId) {
                    res.status(401).json({ success: false, message: "User not authenticated" });
                    return;
                }
                const user = await User_1.default.findById(userId);
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
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        this.analyzeUserRepositories = async (req, res) => {
            try {
                const { accessToken } = req.body;
                if (!accessToken) {
                    res.status(400).json({ success: false, message: "Access token required" });
                    return;
                }
                // Logic to analyze repositories using GitHubService
                res.json({ success: true, message: "Repositories analyzed successfully" });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        this.getSuggestedIssues = async (req, res) => {
            try {
                const { accessToken } = req.body;
                // Use GitHubService to find issues
                res.json({ success: true, data: { issues: [] } });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        this.githubService = new githubService_1.GitHubService();
    }
}
exports.ContributorController = ContributorController;
//# sourceMappingURL=contributorController.js.map