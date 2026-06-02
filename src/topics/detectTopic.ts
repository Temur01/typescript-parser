const TOPICS = [
  {
    name: "Health",
    keywords: ["health", "fitness", "weight", "walking", "running", "diet", "sleep", "workout", "meal", "doctor", "medicine"]
  },
  {
    name: "Education",
    keywords: ["education", "school", "course", "study", "student", "university", "college", "master", "scholarship", "exam"]
  },
  {
    name: "Career",
    keywords: ["career", "job", "interview", "resume", "cv", "salary", "promotion", "hiring", "recruiter", "workplace"]
  },
  {
    name: "Finance",
    keywords: ["finance", "money", "budget", "saving", "investment", "tax", "invoice", "bank", "crypto", "stock"]
  },
  {
    name: "Business",
    keywords: ["business", "startup", "marketing", "sales", "customer", "product", "strategy", "pricing", "brand"]
  },
  {
    name: "Language Learning",
    keywords: ["language", "english", "ielts", "speaking", "writing", "grammar", "vocabulary", "translation"]
  },
  {
    name: "Travel",
    keywords: ["travel", "flight", "hotel", "visa", "trip", "itinerary", "country", "city", "tourism"]
  },
  {
    name: "Home and Life",
    keywords: ["home", "family", "routine", "habit", "planning", "shopping", "recipe", "cleaning", "personal"]
  },
  {
    name: "Creative",
    keywords: ["creative", "story", "writing", "design", "image", "video", "music", "script", "content"]
  },
  {
    name: "Legal",
    keywords: ["legal", "law", "contract", "policy", "terms", "privacy", "compliance", "rights"]
  },
  {
    name: "Programming",
    keywords: [
      "typescript",
      "javascript",
      "react",
      "next.js",
      "nextjs",
      "node",
      "frontend",
      "backend",
      "api",
      "database",
      "github",
      "bug",
      "code"
    ]
  },
  {
    name: "AI",
    keywords: ["artificial intelligence", "machine learning", "llm", "openai", "rag", "embedding", "neural", "quantum"]
  },
  {
    name: "AI Tools",
    keywords: ["chatgpt", "codex", "claude", "prompt", "cursor", "copilot", "agent", "perplexity"]
  }
] as const;

export type TopicName = (typeof TOPICS)[number]["name"] | "Other";

export function detectTopic(title: string, messages: string[]): TopicName {
  const haystack = `${title}\n${messages.join("\n")}`.toLowerCase();

  for (const topic of TOPICS) {
    if (topic.keywords.some((keyword) => haystack.includes(keyword))) {
      return topic.name;
    }
  }

  return "Other";
}
