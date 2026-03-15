import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const SAMPLE_PROMPTS = [
  "Tell me about Mukhyamantri Kanya Utthan Yojana",
  "What documents are required for PM-KISAN?",
  "How can I apply and which office should I visit?",
];

function renderInlineBold(text) {
  const parts = text.split("**");
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={`${part}-${index}`}>{part}</strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

function formatAnswer(answer) {
  const lines = answer.replace(/\r/g, "").split("\n");
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  };
// ah
  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      blocks.push({ type: "space" });
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2).trim());
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push({ type: "h3", text: line.replace(/^###\s+/, "") });
      return;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "") });
      return;
    }

    if (line.startsWith("# ")) {
      flushList();
      blocks.push({ type: "h1", text: line.replace(/^#\s+/, "") });
      return;
    }

    flushList();
    blocks.push({ type: "p", text: line });
  });

  flushList();
  return blocks;
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [model, setModel] = useState("");
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    const value = prompt.trim();
    if (!value || loading) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setIntent("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Request failed");
      }

      setAnswer(data.answer || "");
      setModel(data.model || "");
      setIntent(data.intent || "");
    } catch (err) {
      setError(err.message || "Unable to fetch response");
    } finally {
      setLoading(false);
    }
  };

  const formattedBlocks = answer ? formatAnswer(answer) : [];

  return (
    <main className="page">
      <section className="card">
        <header className="hero">
          <p className="eyebrow">Government Scheme Assistant</p>
          <h1>Bihar Schemes Help Desk</h1>
          <p className="muted">
            Ask about scheme benefits, eligibility, office details, and required documents.
          </p>
          <p className="endpoint">
            API Endpoint: <code>{API_URL}</code>
          </p>
        </header>

        <form onSubmit={onSubmit} className="form">
          <label htmlFor="prompt">Your Question</label>
          <textarea
            id="prompt"
            rows="6"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Example: Am I eligible for Mukhyamantri Vridhjan Pension Yojana?"
          />

          <div className="sample-wrap">
            {SAMPLE_PROMPTS.map((item) => (
              <button
                key={item}
                type="button"
                className="sample-btn"
                onClick={() => setPrompt(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <button className="submit-btn" type="submit" disabled={loading || !prompt.trim()}>
            {loading ? "Checking Scheme Data..." : "Get Guidance"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {answer && (
          <section className="result">
            <div className="result-header">
              <h2>Assistant Response</h2>
              <div className="badges">
                {intent && <span className="pill intent">{intent}</span>}
                {model && <span className="pill model">{model}</span>}
              </div>
            </div>

            <div className="readability-note">
              Verify final eligibility and process at your local office before submission.
            </div>

            <article className="answer">
              {formattedBlocks.map((block, idx) => {
                if (block.type === "space") {
                  return <div key={`space-${idx}`} className="space" />;
                }
                if (block.type === "list") {
                  return (
                    <ul key={`list-${idx}`}>
                      {block.items.map((item, itemIdx) => (
                        <li key={`${item}-${itemIdx}`}>{renderInlineBold(item)}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "h1") {
                  return <h3 key={`h1-${idx}`}>{renderInlineBold(block.text)}</h3>;
                }
                if (block.type === "h2") {
                  return <h4 key={`h2-${idx}`}>{renderInlineBold(block.text)}</h4>;
                }
                if (block.type === "h3") {
                  return <h5 key={`h3-${idx}`}>{renderInlineBold(block.text)}</h5>;
                }
                return <p key={`p-${idx}`}>{renderInlineBold(block.text)}</p>;
              })}
            </article>
          </section>
        )}

        {!answer && !loading && (
          <section className="empty">
            <h2>What you can ask</h2>
            <ul>
              <li>Eligibility criteria for a specific scheme</li>
              <li>Required documents and certificates</li>
              <li>Application steps and designated office details</li>
              <li>Benefit amount and frequency</li>
            </ul>
          </section>
        )}

        {loading && (
          <section className="loading-card">
            <div className="loader" />
            <p>Retrieving scheme records and formatting response...</p>
          </section>
        )}
      </section>
    </main>
  );
}
