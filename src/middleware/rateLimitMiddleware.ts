import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

/**
 * Rate limiting for GitHub API calls to prevent abuse
 */
export const githubApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many GitHub API requests, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiting for repository analysis (more restrictive)
 */
export const repositoryAnalysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 repository analyses per hour
  message: {
    success: false,
    message:
      "Repository analysis rate limit exceeded. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for issue fetching
 */
export const issueFetchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 issue fetch requests per 15 minutes
  message: {
    success: false,
    message: "Issue fetching rate limit exceeded. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
