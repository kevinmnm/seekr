import React, { useCallback, useRef, useState } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import PodcastTranscripts from "@/models/podcastTranscripts";
import {
  CloudArrowUp,
  FileText,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";

export default function PodcastTranscriptUploadModal({
  isOpen,
  resetting,
  resetError,
  onRetryReset,
  onUploadSuccess,
}) {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const mergeFiles = useCallback((incoming = []) => {
    setFiles((prev) => {
      const existing = new Map(prev.map((file) => [file.name, file]));
      incoming.forEach((file) => {
        if (!existing.has(file.name)) existing.set(file.name, file);
      });
      return Array.from(existing.values());
    });
  }, []);

  const handleFileSelection = useCallback(
    (event) => {
      const selected = Array.from(event.target.files || []);
      if (!selected.length) return;
      setError(null);
      mergeFiles(selected);
    },
    [mergeFiles]
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const droppedFiles = Array.from(event.dataTransfer?.files || []);
      if (!droppedFiles.length) return;
      setError(null);
      mergeFiles(droppedFiles);
    },
    [mergeFiles]
  );

  const preventDefault = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const removeFile = useCallback((name) => {
    setFiles((prev) => prev.filter((file) => file.name !== name));
  }, []);

  const handleUpload = useCallback(async () => {
    if (resetting) return;
    if (files.length === 0) {
      setError("Add at least one transcript before uploading.");
      return;
    }
    try {
      setUploading(true);
      setError(null);
      await PodcastTranscripts.upload(files);
      setFiles([]);
      onUploadSuccess();
    } catch (e) {
      setError(e.message || "Failed to upload podcast transcripts.");
    } finally {
      setUploading(false);
    }
  }, [files, onUploadSuccess, resetting]);

  const renderContent = () => {
    if (resetting) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-y-4 py-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <CloudArrowUp className="h-8 w-8 animate-pulse text-theme-text-primary" />
          </div>
          <p className="text-theme-text-primary text-base font-semibold">
            Preparing transcript storage…
          </p>
          <p className="text-theme-text-secondary text-sm max-w-sm">
            Hang tight while we clear out the previous transcripts so you can
            start fresh.
          </p>
        </div>
      );
    }

    if (resetError) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-y-4 py-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 border border-error/40">
            <WarningCircle className="h-8 w-8 text-error" weight="fill" />
          </div>
          <p className="text-theme-text-primary text-base font-semibold">
            Unable to prepare transcript storage.
          </p>
          <p className="text-theme-text-secondary text-sm max-w-md">
            {resetError}
          </p>
          <button
            type="button"
            onClick={onRetryReset}
            className="px-4 py-2 rounded-lg bg-primary-button text-black text-sm font-semibold hover:opacity-90 transition-all"
          >
            Try again
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div
          className="group border border-dashed border-theme-modal-border bg-theme-bg-secondary bg-opacity-80 rounded-xl px-6 py-8 flex flex-col items-center justify-center gap-y-4 text-center cursor-pointer transition-all duration-200 hover:border-theme-text-primary hover:bg-theme-bg-secondary hover:bg-opacity-100"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={preventDefault}
          onDragEnter={preventDefault}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 transition group-hover:bg-white/10">
            <CloudArrowUp className="h-8 w-8 text-theme-text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-theme-text-primary font-semibold text-base">
              Drag & drop podcast transcripts or browse your files
            </p>
            {/* <p className="text-theme-text-secondary text-sm max-w-md mx-auto">
              Plain text, markdown, DOCX, or any text-based transcript files
              work great. You can add multiple files in one go.
            </p> */}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelection}
            className="hidden"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide font-semibold text-theme-text-secondary">
            Selected transcripts
          </p>
          {files.length === 0 ? (
            <div className="rounded-lg border border-dashed border-theme-modal-border bg-theme-bg-secondary bg-opacity-60 px-4 py-6 text-center text-sm text-theme-text-secondary">
              No transcript selected yet. Add a file above to continue.
            </div>
          ) : (
            <ul className="space-y-2 max-h-44 overflow-y-auto pr-2">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center justify-between bg-theme-bg-secondary bg-opacity-80 border border-theme-modal-border rounded-lg px-4 py-2 text-sm text-theme-text-primary shadow-sm"
                >
                  <span className="flex items-center gap-x-2">
                    <FileText className="w-4 h-4 text-theme-text-secondary" />
                    <span className="truncate max-w-xs">{file.name}</span>
                  </span>
                  <button
                    type="button"
                    className="text-theme-text-secondary hover:text-error transition-colors"
                    onClick={() => removeFile(file.name)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all bg-primary-button text-black hover:opacity-90 disabled:bg-theme-modal-border disabled:text-theme-text-secondary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading…" : "Upload transcript"}
        </button>
      </div>
    );
  };

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="w-full max-w-xl bg-theme-bg-primary border border-theme-modal-border rounded-xl shadow-2xl p-8 text-theme-text-primary animate-fade-in">
        <div className="space-y-2 mb-6">
          <h2 className="text-theme-text-primary text-2xl font-semibold">
            Provide Podcast Transcript
          </h2>
          <p className="text-theme-text-secondary text-sm">
            Upload the raw transcript for this session. It will be used for
            downstream processing and cleared on page reloads.
          </p>
        </div>
        {renderContent()}
      </div>
    </ModalWrapper>
  );
}
