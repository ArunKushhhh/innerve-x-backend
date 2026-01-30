"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContext = void 0;
const generative_ai_1 = require("@google/generative-ai");
const LLM_1 = require("../data/LLM");
async function fetchRepoInfo(githubUrl) {
    console.log(`🔍 fetchRepoInfo: fetching metadata for ${githubUrl}`);
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (!match)
        throw new Error(`Invalid GitHub URL: ${githubUrl}`);
    const [, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    console.log(`👉 GET ${apiUrl}`);
    const resp = await fetch(apiUrl, {
        headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
        },
    });
    if (!resp.ok) {
        const text = await resp.text();
        console.error(`⚠️ GitHub API error (${resp.status}): ${text}`);
        throw new Error(`GitHub API error ${resp.status}: ${text}`);
    }
    const data = (await resp.json());
    const info = {
        full_name: data.full_name,
        description: data.description,
        stargazers_count: data.stargazers_count,
        open_issues_count: data.open_issues_count,
        language: data.language,
        url: githubUrl,
        html_url: data.html_url,
    };
    console.log(`✅ fetched info:`, info);
    return info;
}
const generateContext = async (req, res, next) => {
    try {
        console.log(`📝 generateContext request body:`, req.body);
        const { repos } = req.body;
        if (!Array.isArray(repos) || repos.length === 0) {
            console.warn(`❌ Validation failed: repos must be a non-empty array`);
            res
                .status(400)
                .json({
                success: false,
                message: "`repos` must be a non-empty array of URLs",
            });
            return;
        }
        // 1. fetch RepoInfo[]
        console.log(`📥 Fetching info for ${repos.length} repositories…`);
        const infos = await Promise.all(repos.map(fetchRepoInfo));
        console.log(`📥 All repo infos:`, infos);
        // 2. build the prompt
        const prompt = (0, LLM_1.buildRepoContextPrompt)(infos);
        console.log(`📨 Prompt sent to Gemini:\n${prompt}`);
        // 3. Initialize Gemini client
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            throw new Error("GEMINI_API_KEY environment variable is not set");
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: "You explain open-source repositories.",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            },
        });
        // 4. Call Gemini
        console.log(`🤖 Calling Gemini gemini-2.0-flash…`);
        const result = await model.generateContent(prompt);
        const summary = result.response.text().trim();
        console.log(`✅ Summary generated:\n${summary}`);
        // 5. Return
        res.json({ success: true, data: summary });
    }
    catch (err) {
        console.error("❌ generateContext error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.generateContext = generateContext;
//# sourceMappingURL=LLMcontroller.js.map