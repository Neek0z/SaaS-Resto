export type ReviewSource = "Google" | "TripAdvisor" | "TheFork";

export const REVIEW_SOURCES: ReviewSource[] = ["Google", "TripAdvisor", "TheFork"];

export type Review = {
  id: string;
  restaurantId: string;
  source: ReviewSource;
  author: string;
  rating: number;
  scale: number;
  text: string;
  replied: boolean;
  replyText: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewReview = {
  source: ReviewSource;
  author: string;
  rating: number;
  scale?: number;
  text: string;
  createdAt?: string;
};

export type ReviewPatch = {
  source?: ReviewSource;
  author?: string;
  rating?: number;
  scale?: number;
  text?: string;
  replied?: boolean;
  replyText?: string | null;
};

export type SourceAggregate = {
  source: ReviewSource;
  rating: number;
  scale: number;
  count: number;
};
