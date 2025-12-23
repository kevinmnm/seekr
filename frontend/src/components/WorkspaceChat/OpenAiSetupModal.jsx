import { useEffect, useState } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import System from "@/models/system";
import showToast from "@/utils/toast";

export default function OpenAiSetupModal({ isOpen, onConfigured = () => {} }) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setApiKey("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!apiKey || apiKey.trim().length === 0) {
      setError("Please enter a valid OpenAI API key.");
      return;
    }

    setSaving(true);
    setError(null);
    const { error } = await System.updateSystem({
      OpenAiKey: apiKey.trim(),
    });

    if (error) {
      setSaving(false);
      setError(error);
      return;
    }

    showToast("OpenAI API key saved.", "success");
    setSaving(false);
    onConfigured();
  }

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex items-center justify-center">
        <div className="relative w-full max-w-xl bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border">
          <div className="p-6 border-b border-theme-modal-border">
            <h3 className="text-xl font-semibold text-white">
              OpenAI Settings Required
            </h3>
            <p className="text-sm text-white/70 mt-2">
              Agents require an OpenAI-compatible model. Enter your OpenAI API
              key below to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-7 pt-6 pb-4 space-y-6">
            <div className="flex flex-col gap-y-2">
              <label
                htmlFor="openai-api-key-input"
                className="text-white text-sm font-semibold"
              >
                API Key
              </label>
              <input
                id="openai-api-key-input"
                type="password"
                className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                placeholder="sk-..."
                autoComplete="off"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-x-2 border-t border-theme-modal-border pt-5">
              <button
                type="submit"
                disabled={saving}
                className="transition-all duration-300 bg-white text-black hover:opacity-70 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save API Key"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalWrapper>
  );
}
