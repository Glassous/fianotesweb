/**
 * This script runs during the build process.
 * 1. Scans the 'content' directory (where private repo is checked out).
 * 2. Parses Frontmatter and Content.
 * 3. Generates src/data/notes-data.json
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";
import matter from "gray-matter";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { execSync } from "child_process";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONTENT_DIR = path.join(process.cwd(), "content"); // GitHub Action checks out private repo here
const OUTPUT_FILE = path.join(process.cwd(), "src", "data", "notes-data.json");

async function buildNotesManifest() {
  // Check if content directory exists, if not try to clone using env vars
  if (!fs.existsSync(CONTENT_DIR)) {
    const repoPath = process.env.NOTES_REPO_PATH;
    const pat = process.env.NOTES_PAT;

    if (repoPath && pat) {
      console.log(`📥 Cloning repository ${repoPath} into ${CONTENT_DIR}...`);
      try {
        const repoUrl = `https://${pat}@github.com/${repoPath}.git`;
        execSync(`git clone ${repoUrl} "${CONTENT_DIR}"`, { stdio: "inherit" });
        console.log("✅ Repository cloned successfully.");
      } catch (error) {
        console.error("❌ Failed to clone repository:", error);
        // Don't return here, let it fall through to the warning if directory is still missing
      }
    } else {
       console.log("ℹ️ NOTES_REPO_PATH or NOTES_PAT not set in .env.local. Skipping auto-clone.");
    }
  }

  console.log(`🔍 Scanning for Markdown files in: ${CONTENT_DIR}`);

  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(
      `⚠️ Content directory not found at ${CONTENT_DIR}. Using Mock Data.`,
    );
    // Ensure the output file is cleared or handled so App.tsx knows to use mock data?
    // Actually, if we don't write the file, the App.tsx try-catch block handles it.
    // But let's remove the file if it exists to ensure fresh state if scan fails.
    if (fs.existsSync(OUTPUT_FILE)) {
       fs.unlinkSync(OUTPUT_FILE);
    }
    return;
  }

  // Find all .md, .html and code files recursively
  const files = await glob("**/*.{md,html,c,cpp,h,hpp,java,py,js,jsx,ts,tsx,sql,css,json,go,rs,sh,yaml,yml,xml,kt,kts,php,rb,cs,swift,lua,r,dart,bat,cmd,ps1,vue,pdf,typ}", { cwd: CONTENT_DIR });

  const notesData = files.map((file) => {
    const fullPath = path.join(CONTENT_DIR, file);
    const fileContent = fs.readFileSync(fullPath, "utf-8");

    // Parse Frontmatter
    const { data, content } = matter(fileContent);

    return {
      filePath: file, // Relative path, serves as ID
      content: content,
      metadata: data,
    };
  });

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(notesData, null, 2));
  console.log(
    `✅ Successfully generated manifest with ${notesData.length} notes at ${OUTPUT_FILE}`,
  );
}

buildNotesManifest().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
