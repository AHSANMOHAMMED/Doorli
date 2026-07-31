"use client";

import { useState } from "react";
import { Loader2, Send, Star, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";

type SentimentResponse = {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
};

export function AIReviewAnalyzer({ vendorId }: { vendorId: string }) {
  const [review, setReview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SentimentResponse | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleAnalyze = async () => {
    if (!review.trim()) return;
    setAnalyzing(true);
    setError("");
    setResult(null);
    setSubmitted(false);

    try {
      const res = await apiFetch<SentimentResponse>("/ai/analyze-review", {
        method: "POST",
        body: JSON.stringify({ review }),
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze review");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    // In a real app, this would submit to the backend database
    setSubmitted(true);
    setTimeout(() => {
      setReview("");
      setResult(null);
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this vendor..."
          className="w-full h-32 doorli-glass rounded-2xl p-4 text-sm text-white placeholder-white/30 resize-none border-white/20 focus:border-[var(--doorli-mint)] focus:ring-1 focus:ring-[var(--doorli-mint)] transition-all outline-none"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {result && (
            <div className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
              result.sentiment === "positive" ? "bg-emerald-500/20 text-emerald-300" :
              result.sentiment === "negative" ? "bg-rose-500/20 text-rose-300" :
              "bg-gray-500/20 text-gray-300"
            }`}>
              <Star className="w-3 h-3" />
              {result.sentiment} ({Math.round(result.score * 100)}%)
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !review.trim() || submitted}
            className="doorli-cta-ghost px-3 py-1.5 text-xs rounded-xl flex items-center gap-1 disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Analyze
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-300 text-xs bg-rose-500/10 p-2 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {result && !submitted && (
        <div className="flex justify-end">
          <button onClick={handleSubmit} className="doorli-cta-primary text-sm px-6 py-2">
            Submit Review
          </button>
        </div>
      )}

      {submitted && (
        <div className="text-emerald-400 text-sm font-semibold flex items-center justify-end gap-2 animate-bounce-in">
          <Star className="w-4 h-4 fill-emerald-400" />
          Review Submitted!
        </div>
      )}
    </div>
  );
}
