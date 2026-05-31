import type { ArchiveIntelligence } from '@/app/components/ArchiveInsightsCard';
import type { MemoryProofItem } from '@/app/components/MemoryProofCard';

export interface BootstrapMemory {
  memory_id: string;
  title: string;
  summary: string;
  status: string;
  processing_stage?: string;
  processing_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BootstrapPerson {
  id: string;
  name: string;
  role: string;
  biography: string;
  memory_count: number;
  places: string[];
  years: string[];
  events: string[];
  metadata?: {
    photo_url?: string;
    birth_year?: string | number;
    notes?: string;
    node_x?: number;
    node_y?: number;
  };
}

export interface BootstrapPayload {
  memory_count?: number;
  memories: BootstrapMemory[];
  insights: {
    count: number;
    summaries: Array<{ memory_id: string; title: string; summary: string }>;
    duplicates: string[][];
    top_people: Array<[string, number]>;
  };
  graph: { nodes: Array<{ id: string; group: string; label: string }>; links: Array<{ source: string; target: string; label: string }> };
  timeline: Array<{ year: number; count: number }>;
  story_sessions: Array<{
    session_id: string;
    title: string;
    mode: string;
    status: string;
    next_question?: string | null;
    summary?: string | null;
    message_count: number;
  }>;
  people: BootstrapPerson[];
  family_relationships: Array<{ relationship_id: string; person_a: string; relation: string; person_b: string; notes?: string | null }>;
  weekly_reports: Array<{
    report_id: string;
    title: string;
    recipient_type: string;
    subject: string;
    body: string;
    share_token?: string | null;
    is_public?: boolean;
    created_at: string;
  }>;
  report_recipients: Array<{
    recipient_id: string;
    name: string;
    email: string;
    relationship?: string | null;
    cadence: string;
    created_at: string;
  }>;
  storybooks: Array<{
    storybook_id: string;
    title: string;
    style: string;
    chapters: Array<{ chapter: number; title: string; summary: string; visual_prompt: string; people?: string[]; places?: string[]; memory_id?: string }>;
    created_at: string;
    share_token?: string | null;
  }>;
  memory_proofs: { proofs: MemoryProofItem[] };
  family_rituals: Array<{
    ritual_id: string;
    title: string;
    cadence: string;
    questions: string[];
    responses?: Array<{ question: string; answer: string; memory_id: string; created_at: string }>;
    created_at: string;
  }>;
  memory_capsules: Array<{
    capsule_id: string;
    title: string;
    recipient_name?: string | null;
    share_token: string;
    unlock_at?: string | null;
    created_at: string;
  }>;
  legacy_contacts: Array<{
    contact_id: string;
    name: string;
    email: string;
    relationship?: string | null;
    permissions: string[];
    created_at?: string | null;
  }>;
  life_map_snapshots: Array<{
    snapshot_id: string;
    title: string;
    person?: string | null;
    categories: Array<{ label: string; count: number; nodes: Array<{ title: string; summary: string }> }>;
    created_at: string;
  }>;
  archive_intelligence: ArchiveIntelligence;
  usage: {
    plan: string;
    daily_uploads: number;
    daily_upload_limit: number;
    daily_queries: number;
    daily_query_limit: number;
    uploads_remaining: number;
    queries_remaining: number;
  };
  ai: { provider: string; reachable: boolean; chat_model?: string };
  notifications: Array<{ id: string; type: string; title: string; body: string; memory_id?: string }>;
  processing_queue: BootstrapMemory[];
  shared_archives?: Array<{ owner_id: string; owner_name: string; role: string }>;
  archive_owner_id?: string;
  viewing_as_contributor?: boolean;
}
