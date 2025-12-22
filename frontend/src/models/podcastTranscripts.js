import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const PodcastTranscripts = {
  reset: async function () {
    const response = await fetch(`${API_BASE}/podcast-transcripts/reset`, {
      method: "POST",
      headers: baseHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error(
        data?.error || "Unable to reset podcast transcript storage."
      );
    }
    return data;
  },
  upload: async function (files = []) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${API_BASE}/podcast-transcripts/upload`, {
      method: "POST",
      headers: baseHeaders(),
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || "Unable to upload podcast transcripts.");
    }
    return data;
  },
};

export default PodcastTranscripts;
