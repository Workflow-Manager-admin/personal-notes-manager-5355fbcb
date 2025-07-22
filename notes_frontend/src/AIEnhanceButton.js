import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * AIEnhanceButton Component: Calls the OpenAI API to enhance or suggest note content.
 * Props:
 * - noteTitle: The title to send as part of AI context.
 * - noteBody: The current note body content to enhance/complete.
 * - onEnhance: Callback(newBodyStr) called with AI-suggested note content.
 * - disabled: (boolean) disables the button (e.g., empty note).
 */
export default function AIEnhanceButton({ noteTitle, noteBody, onEnhance, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Abstracted for future customization
  function buildMessage(title, body) {
    if ((!body || body.trim() === "") && (!title || title.trim() === "")) {
      return "Generate a new, short note about a personal idea or reminder.";
    }
    if (!body || body.trim() === "") {
      return `Draft a personal note about "${title}" (as if it is the start of a note). Respond with a useful, concise note.`;
    }
    return `Improve, complete, or suggest refinements for the following note titled "${title}":\n---\n${body}\n---\nRespond with an enhanced or completed note (do not comment or explain).`;
  }

  // Handle click: call OpenAI API
  async function handleEnhance() {
    setLoading(true);
    setError("");

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || window.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      setLoading(false);
      setError("OpenAI API key not found.");
      return;
    }

    const url = "https://api.openai.com/v1/chat/completions";
    const systemPrompt =
      "You are an assistant that helps users write and improve personal notes. Respond only with improved note content.";
    const userMsg = buildMessage(noteTitle, noteBody);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg }
          ],
          temperature: 0.7,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        const respText = await response.text();
        throw new Error(`AI Error: ${response.status} ${respText}`);
      }
      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content?.trim();
      if (!aiContent) {
        throw new Error("AI did not return content.");
      }
      onEnhance(aiContent);
    } catch (err) {
      setError(err.message || "Failed to enhance with AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="me-2 d-inline-block" style={{minWidth: 48}}>
      <button
        type="button"
        aria-label="Enhance note with AI"
        title="Let AI help improve or suggest note content"
        className="btn btn-outline-secondary"
        style={{ fontSize: "1.10em", display: "inline-flex", alignItems: "center", gap: 6 }}
        onClick={handleEnhance}
        disabled={loading || disabled}
      >
        <span role="img" aria-label="magic wand" style={{ marginRight: 4 }}>🪄</span>
        {loading ? "Enhancing…" : "Enhance with AI"}
      </button>
      {error &&
        <span className="text-danger d-block mt-1 small" style={{maxWidth: 260}}>
          {error}
        </span>
      }
    </span>
  );
}
