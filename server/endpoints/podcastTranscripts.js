const fs = require("fs");
const path = require("path");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  clearPodcastTranscriptStorage,
  ensurePodcastTranscriptStorage,
} = require("../utils/files/podcastTranscripts");
const { handlePodcastTranscriptUpload } = require("../utils/files/multer");

function podcastTranscriptEndpoints(app) {
  if (!app) return;

  app.get("/podcast-transcripts/all", async (_request, response) => {
    console.log('hi')
    try {
      const directory = ensurePodcastTranscriptStorage();
      const entries = await fs.promises.readdir(directory, {
        withFileTypes: true,
      });
      const files = await Promise.all(
        entries
          .filter((entry) => entry.isFile())
          .map(async (entry) => {
            const absolutePath = path.join(directory, entry.name);
            const content = await fs.promises.readFile(absolutePath, "utf8");
            return {
              name: entry.name,
              content,
            };
          })
      );
      response.status(200).json({ success: true, files });
    } catch (error) {
      console.error(error);
      response.status(500).json({
        success: false,
        error: "Failed to read podcast transcripts.",
      });
    }
  });

  app.post(
    "/podcast-transcripts/reset",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (_request, response) => {
      try {
        await clearPodcastTranscriptStorage();
        response.status(200).json({ success: true });
      } catch (error) {
        console.error(error);
        response
          .status(500)
          .json({ success: false, error: "Failed to reset transcripts." });
      }
    }
  );

  app.post(
    "/podcast-transcripts/upload",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      handlePodcastTranscriptUpload,
    ],
    async (request, response) => {
      try {
        ensurePodcastTranscriptStorage();
        const files = Array.isArray(request.files) ? request.files : [];
        response.status(200).json({
          success: true,
          files: files.map((file) => ({
            originalname: file.originalname,
            filename: file.filename,
            size: file.size,
          })),
        });
      } catch (error) {
        console.error(error);
        response.status(500).json({
          success: false,
          error: "Failed to store podcast transcripts.",
        });
      }
    }
  );
}

module.exports = { podcastTranscriptEndpoints };
