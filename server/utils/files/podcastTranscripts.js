const fs = require("fs");
const path = require("path");

const podcastTranscriptsPath =
  process.env.NODE_ENV === "development"
    ? path.resolve(__dirname, "../../storage/podcast-transcripts")
    : path.resolve(process.env.STORAGE_DIR, "podcast-transcripts");

function ensurePodcastTranscriptStorage() {
  fs.mkdirSync(podcastTranscriptsPath, { recursive: true });
  return podcastTranscriptsPath;
}

async function clearPodcastTranscriptStorage() {
  ensurePodcastTranscriptStorage();
  const entries = await fs.promises.readdir(podcastTranscriptsPath);
  await Promise.all(
    entries.map((entry) =>
      fs.promises.rm(path.join(podcastTranscriptsPath, entry), {
        recursive: true,
        force: true,
      })
    )
  );
}

module.exports = {
  podcastTranscriptsPath,
  ensurePodcastTranscriptStorage,
  clearPodcastTranscriptStorage,
};
