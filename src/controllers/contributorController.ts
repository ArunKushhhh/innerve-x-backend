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
      // Get user from JWT (set by authMiddleware)
      const authReq = req as any;
      const userId = authReq.user?.id || authReq.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized - no user ID in token",
        });
        return;
      }

      // Fetch user from database to get GitHub access token
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      if (!user.accessToken) {
        res.status(400).json({
          success: false,
          message:
            "GitHub authorization required. Please re-authenticate with GitHub.",
        });
        return;
      }

      console.log("🔍 Analyzing repositories for:", user.githubUsername);

      const headers = {
        Authorization: `Bearer ${user.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      };

      let allRepos: any[] = [];

      // 1. Fetch user's personal repositories
      // type=all might include org repos the user is a member of depending on permissions,
      // but explicitly fetching org repos ensures we get everything structure correctly.
      try {
        const personalReposRes = await fetch(
          `https://api.github.com/user/repos?per_page=100&sort=updated&direction=desc&type=all`,
          { headers },
        );

        if (personalReposRes.ok) {
          const personalRepos = await personalReposRes.json();
          allRepos = [...personalRepos];
          console.log(
            `✅ Fetched ${personalRepos.length} personal repositories`,
          );
        } else {
          const errorText = await personalReposRes.text();
          console.error(
            "GitHub API error (personal repos):",
            personalReposRes.status,
            errorText,
          );
        }
      } catch (err) {
        console.error("Failed to fetch personal repositories:", err);
      }

      // 2. Fetch user's organizations
      try {
        const orgsRes = await fetch(`https://api.github.com/user/orgs`, {
          headers,
        });
        if (orgsRes.ok) {
          const orgs = await orgsRes.json();
          console.log(
            `🏢 Found ${orgs.length} organizations:`,
            orgs.map((o: any) => o.login).join(", "),
          );

          // 3. Fetch repos for each org
          for (const org of orgs) {
            try {
              const orgReposRes = await fetch(
                `https://api.github.com/orgs/${org.login}/repos?per_page=100&sort=updated&direction=desc`,
                { headers },
              );

              if (orgReposRes.ok) {
                const orgRepos = await orgReposRes.json();
                console.log(`  - ${org.login}: ${orgRepos.length} repos`);
                allRepos = [...allRepos, ...orgRepos];
              } else {
                console.error(
                  `Failed to fetch repos for ${org.login}: ${orgReposRes.status}`,
                );
              }
            } catch (err) {
              console.error(`Error fetching repos for org ${org.login}:`, err);
            }
          }
        } else {
          const errorText = await orgsRes.text();
          console.error(
            `❌ Failed to fetch organizations: ${orgsRes.status} ${orgsRes.statusText}`,
            errorText,
          );
        }
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      }

      // 4. Deduplicate by ID
      const uniqueReposMap = new Map();
      for (const repo of allRepos) {
        uniqueReposMap.set(repo.id, repo);
      }
      const repos = Array.from(uniqueReposMap.values());

      console.log(`✅ Total unique repositories to analyze: ${repos.length}`);

      // Transform repos to include useful analysis data
      const analyzedRepos = repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        openIssuesCount: repo.open_issues_count,
        topics: repo.topics || [],
        isPrivate: repo.private,
        isFork: repo.fork,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        // Derived analysis fields
        hasIssues: repo.has_issues,
        isContributable:
          !repo.archived && repo.has_issues && repo.open_issues_count > 0,
      }));

      // Find repos with good-first-issues or help-wanted issues
      const contributableRepos = analyzedRepos.filter(
        (repo: any) => repo.isContributable && !repo.isFork,
      );

      // 5. Fetch Suggested Issues from top contributable repos
      let suggestedIssues: any[] = [];
      const MAX_REPOS_TO_SCAN = 5; // Limit to avoid rate limits
      const reposToScan = contributableRepos.slice(0, MAX_REPOS_TO_SCAN);

      console.log(
        `🔎 Scanning ${reposToScan.length} repos for specific issues...`,
      );

      for (const repo of reposToScan) {
        try {
          // Fetch open issues with labels 'good first issue' or 'help wanted'
          const issuesRes = await fetch(
            `https://api.github.com/repos/${repo.fullName}/issues?state=open&labels=good%20first%20issue,help%20wanted&per_page=5`,
            { headers },
          );

          if (issuesRes.ok) {
            const issues = await issuesRes.json();
            // Filter out PRs (issues API returns PRs too)
            const realIssues = issues.filter((i: any) => !i.pull_request);

            const formattedIssues = realIssues.map((issue: any) => {
              // Calculate mock bounty/XP based on labels/complexity
              const isAdvanced = issue.labels.some(
                (l: any) =>
                  l.name.toLowerCase().includes("advanced") ||
                  l.name.toLowerCase().includes("hard"),
              );
              const isIntermediate = issue.labels.some(
                (l: any) =>
                  l.name.toLowerCase().includes("medium") ||
                  l.name.toLowerCase().includes("intermediate"),
              );

              let difficulty = "beginner";
              let bounty = 50;
              let xpReward = 100;
              let stakingRequired = 10;

              if (isAdvanced) {
                difficulty = "advanced";
                bounty = 200;
                xpReward = 500;
                stakingRequired = 50;
              } else if (isIntermediate) {
                difficulty = "intermediate";
                bounty = 100;
                xpReward = 250;
                stakingRequired = 25;
              }

              return {
                id: issue.id,
                number: issue.number,
                title: issue.title,
                body: issue.body,
                repository: {
                  name: repo.name,
                  fullName: repo.fullName,
                  htmlUrl: repo.htmlUrl,
                  stargazersCount: repo.stargazersCount,
                  language: repo.language,
                },
                labels: issue.labels.map((l: any) => ({
                  name: l.name,
                  color: l.color,
                })),
                difficulty,
                bounty,
                xpReward,
                stakingRequired,
                htmlUrl: issue.html_url,
                createdAt: issue.created_at,
              };
            });

            suggestedIssues = [...suggestedIssues, ...formattedIssues];
          }
        } catch (err) {
          console.error(
            `Failed to scan repo ${repo.fullName} for issues:`,
            err,
          );
        }
      }

      console.log(`💡 Found ${suggestedIssues.length} suggested issues`);

      res.status(200).json({
        success: true,
        message: `Repository analysis completed - found ${repos.length} repositories and ${suggestedIssues.length} suggested issues`,
        data: {
          repositories: analyzedRepos,
          contributableRepos: contributableRepos.length,
          totalRepos: repos.length,
          languages: [
            ...new Set(
              analyzedRepos.map((r: any) => r.language).filter(Boolean),
            ),
          ],
          suggestedIssues: suggestedIssues,
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
    // Reuse logic or simply map to Analyze for now to keep it synced?
    // For this iteration, we'll recommend users use the Analyze endpoint to refresh.
    // But to fulfill the endpoint, we will try to fetch if we can.
    // NOTE: Best practice would be to store the analysis result in DB and fetch from there.
    // For now, let's trigger a fresh quick scan or return empty if not analyzed.

    // Delegate to analyzeUserRepositories for simplicity in MVP
    return this.analyzeUserRepositories(req, res);
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
