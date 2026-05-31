'use client';

import { useAuth } from '@/app/context/AuthContext';
import { ArchiveInsightsCard, type ArchiveIntelligence } from '@/app/components/ArchiveInsightsCard';
import { FamilyGraphD3 } from '@/app/components/FamilyGraphD3';
import { AppShell } from '@/app/components/AppShell';
import { JudgeModeBanner } from '@/app/components/JudgeModeBanner';
import { StatusBanner } from '@/app/components/StatusBanner';
import { SubNavTabs } from '@/app/components/SubNavTabs';
import { WelcomeModal } from '@/app/components/WelcomeModal';
import { MemoryProofList, type MemoryProofItem } from '@/app/components/MemoryProofCard';
import { isOnboardingComplete, markOnboardingComplete, OnboardingWizard } from '@/app/components/OnboardingWizard';
import { pageMetaForSurface } from '@/app/lib/navigation';
import {
  ASK_BODY,
  ASK_BUSY,
  ASK_PLACEHOLDER,
  ASK_SUBMIT,
  ASK_TITLE,
  AUTO_SEED_HINT,
  BIRTH_YEAR_LABEL,
  CHAPTER_BODY,
  CHAPTER_BUILD,
  CHAPTER_BUSY,
  CHAPTER_TITLE,
  GRAPH_BODY,
  GRAPH_EMPTY,
  GRAPH_NODES_HINT,
  GRAPH_TITLE,
  JOURNEY_STAGES,
  LOADING_APP,
  LOADING_SIGN_IN,
  SEED_BUTTON,
  SEED_BUSY,
  SEED_SUCCESS,
  SOURCES_TITLE,
  SUGGESTED_PROMPTS,
} from '@/app/lib/productCopy';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { API_URL, authHeaders } from '@/app/lib/api';
import type { BootstrapPayload } from '@/app/lib/bootstrapTypes';
import { ARCHIVE_CHANGE_EVENT, getArchiveOwnerId } from '@/app/lib/archiveContext';
import { shouldShowWelcome } from '@/app/components/WelcomeModal';
import { DuplicateMergePanel } from '@/app/components/DuplicateMergePanel';
import { HomeDashboard } from '@/app/components/HomeDashboard';
import { InviteManager } from '@/app/components/InviteManager';
import { SampleArchiveBanner } from '@/app/components/SampleArchiveBanner';
import { MemorySourceDrawer } from '@/app/components/MemorySourceDrawer';

/** Match Next/Image `fill` to real layout width — avoids 100vw warnings in cards. */
const PAGE_BG_IMAGE_SIZES = '100vw';
const HERO_PANEL_IMAGE_SIZES = '(min-width: 1536px) 1536px, (min-width: 1024px) 92vw, 100vw';
const CARD_IMAGE_SIZES = '(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw';

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
};

import type { MemorySurface } from '@/app/lib/memoryTypes';

export type { MemorySurface } from '@/app/lib/memoryTypes';

const AUTO_SEED_KEY = 'memorygraph_auto_seed_v1';
const AUTO_SEED_ENABLED = process.env.NEXT_PUBLIC_AUTO_SEED === 'true';

/** Surfaces removed from product — redirect to the right home. */
const DEPRECATED_SURFACE_REDIRECTS: Partial<Record<MemorySurface, string>> = {
  'story-companion': '/settings',
  presence: '/settings',
  care: '/settings',
  'legacy-tree': '/settings',
  'legacy-contacts': '/settings',
  'family-rituals': '/settings',
  'life-map': '/family',
  messages: '/ask',
  storyboards: '/stories',
  reports: '/stories',
  'life-chapters': '/stories',
  'memory-proof': '/ask',
};

type StudioMode = 'sample' | 'upload' | null;

interface MemoryItem {
  memory_id: string;
  title: string;
  summary: string;
  raw_text?: string;
  status: string;
  created_at?: string | null;
}

interface MemoryListResponse {
  memories: MemoryItem[];
}

interface InsightsResponse {
  count: number;
  summaries: Array<{ memory_id: string; title: string; summary: string }>;
  duplicates: string[][];
  top_people: Array<[string, number]>;
}

interface GraphNode {
  id: string;
  group: string;
  label: string;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface GraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface TimelineYear {
  year: number;
  count: number;
}

interface SearchResult {
  memory_id: string;
  metadata?: { original_filename?: string };
  structured_data?: {
    summary?: string;
    people?: string[];
    places?: string[];
    dates?: string[];
    events?: string[];
  };
  raw_text?: string;
}

interface SearchResponse {
  results: SearchResult[];
}

interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  relationships: Array<{ source: string; relation: string; target: string }>;
  proofs?: MemoryProofItem[];
}

interface TimeMachineResponse {
  narrative: string;
  needs_birth_year: boolean;
  resolved_person?: string | null;
  year_start?: number | null;
  year_end?: number | null;
  timeline: Array<{ year?: number | null; date_text?: string | null; label: string; memory_id: string }>;
  memories: SearchResult[];
  proofs?: MemoryProofItem[];
}

interface UploadResponse {
  memory_id: string;
  status: string;
  processing_stage: string;
}

interface MemoryStatusResponse {
  memory_id: string;
  status: string;
  processing_stage: string;
  processing_error?: string | null;
}

interface StorySessionSummary {
  session_id: string;
  mode: string;
  title: string;
  status: string;
  next_question?: string | null;
  summary?: string | null;
  message_count: number;
}

interface StoryMessage {
  role: string;
  content: string;
  created_at?: string;
}

interface PersonProfileSummary {
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

interface FamilyRelationshipItem {
  relationship_id: string;
  person_a: string;
  relation: string;
  person_b: string;
  notes?: string | null;
  source?: string;
}

interface WeeklyReportDraft {
  report_id: string;
  title: string;
  recipient_type: string;
  subject: string;
  body: string;
  share_token?: string | null;
  is_public?: boolean;
  created_at: string;
}

interface ReportRecipientItem {
  recipient_id: string;
  name: string;
  email: string;
  relationship?: string | null;
  cadence: string;
  created_at: string;
}

interface StorybookItem {
  storybook_id: string;
  title: string;
  style: string;
  chapters: Array<{ chapter: number; title: string; summary: string; visual_prompt: string; people?: string[]; places?: string[]; memory_id?: string }>;
  created_at: string;
  share_token?: string | null;
}

interface LegacyPayload {
  score: number;
  stage: string;
  inputs: Record<string, number>;
  badges: Array<{ key: string; title: string; earned: boolean }>;
  next_action: string;
}

interface CarePayload {
  signals: Array<{ label: string; value: string; tone: string }>;
  disclaimer: string;
}

interface MemoryDnaPayload {
  person: string;
  core_values: string[];
  recurring_places: string[];
  important_people: string[];
  emotional_themes: string[];
  life_phases: Array<{ label: string; years: string[] }>;
  what_shaped_them: string;
  source_count: number;
  proof: MemoryProofItem[];
}

interface LifeChapter {
  title: string;
  narrative: string;
  sources: string[];
  proof: MemoryProofItem[];
}

interface LifeChaptersPayload {
  person: string;
  chapters: LifeChapter[];
}

interface FamilyRitualItem {
  ritual_id: string;
  title: string;
  cadence: string;
  questions: string[];
  responses?: Array<{ question: string; answer: string; memory_id: string; created_at: string }>;
  created_at: string;
}

interface MemoryCapsuleItem {
  capsule_id: string;
  title: string;
  recipient_name?: string | null;
  share_token: string;
  unlock_at?: string | null;
  created_at: string;
}

interface LegacyContactItem {
  contact_id: string;
  name: string;
  email: string;
  relationship?: string | null;
  permissions: string[];
  created_at?: string | null;
}

interface TrustPayload {
  mode: string;
  ai: Record<string, unknown>;
  privacy_promises: string[];
  readiness: Record<string, number | boolean>;
}

interface OneLifeStoryPayload {
  title: string;
  person: string;
  memory_dna: MemoryDnaPayload;
  chapters: LifeChapter[];
  proof: MemoryProofItem[];
  weekly_report?: { report_id: string; subject: string; body: string } | null;
  storybook?: { storybook_id: string; title: string; chapters: Array<{ title: string; summary: string }> } | null;
  next_actions: string[];
}

interface PresencePayload {
  answer: string;
  mode: string;
  person: string;
  sources: SearchResult[];
  memory_dna: MemoryDnaPayload;
}

interface LifeMapSnapshotItem {
  snapshot_id: string;
  title: string;
  person?: string | null;
  categories: Array<{ label: string; count: number; nodes: Array<{ title: string; summary: string }> }>;
  created_at: string;
}

interface AuditEvent {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  created_at?: string | null;
}

const familyImages = [
  {
    src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80',
    alt: 'Family sharing a quiet moment at home',
  },
  {
    src: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
    alt: 'Parent and child looking through family memories',
  },
  {
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    alt: 'Family gathered together outdoors',
  },
  {
    src: 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?auto=format&fit=crop&w=900&q=80',
    alt: 'Family celebration around a table',
  },
  {
    src: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=900&q=80',
    alt: 'Old family photographs arranged on a table',
  },
];

const journeyStages = [...JOURNEY_STAGES];

const uploadStageIndex: Record<string, number> = {
  uploaded: 0,
  metadata: 0,
  content_extraction: 1,
  ai_enrichment: 2,
  relationship_processing: 3,
  indexing: 4,
  completed: 5,
};

const suggestedPrompts = [...SUGGESTED_PROMPTS];

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function formatDate(value?: string | null) {
  if (!value) return 'Undated';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function sourceSummary(memory: MemoryItem | SearchResult) {
  if ('summary' in memory) return memory.summary || memory.raw_text || 'Memory ready for exploration.';
  return memory.structured_data?.summary || memory.raw_text || 'Source memory connected to this answer.';
}

function sourceTitle(memory: MemoryItem | SearchResult) {
  if ('title' in memory) return memory.title;
  return memory.metadata?.original_filename || 'Source memory';
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function downloadTextFile(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildWeeklyReport({
  memories,
  topPeople,
  topPlaces,
  storyEvents,
  timeline,
  messageCards,
}: {
  memories: MemoryItem[];
  topPeople: Array<[string, number]>;
  topPlaces: GraphNode[];
  storyEvents: GraphNode[];
  timeline: TimelineYear[];
  messageCards: MemoryItem[];
}) {
  const people = topPeople.slice(0, 5).map(([person]) => person).join(', ') || 'family members still being discovered';
  const places = topPlaces.slice(0, 4).map((place) => place.label).join(', ') || 'important places still being discovered';
  const events = storyEvents.slice(0, 4).map((event) => event.label).join(', ') || 'new memory signals';
  const span = timeline[0]?.year ? `${timeline[0].year}-${timeline[timeline.length - 1]?.year || timeline[0].year}` : 'a growing timeline';
  const heart = messageCards[0]?.summary || 'A heartfelt family memory is ready to revisit.';

  return [
    'This Week in Your Family Archive',
    '',
    `MemoryGraph understood ${memories.length} memories across ${span}.`,
    `People appearing most often: ${people}.`,
    `Places shaping the story: ${places}.`,
    `New story signals: ${events}.`,
    '',
    'Heart moment:',
    heart,
    '',
    'Suggested family questions:',
    '- What memories involve grandfather?',
    "- Show father's life between age 20-30.",
    '- Which places shaped this family story?',
    '',
    'Generated by MemoryGraph AI.',
  ].join('\n');
}

function MemoryCard({
  memory,
  compact = false,
  onArchive,
  onDelete,
}: {
  memory: MemoryItem | SearchResult;
  compact?: boolean;
  onArchive?: (memoryId: string) => void;
  onDelete?: (memoryId: string) => void;
}) {
  const people = 'structured_data' in memory ? memory.structured_data?.people || [] : [];
  const places = 'structured_data' in memory ? memory.structured_data?.places || [] : [];

  return (
    <div className={`rounded-lg border border-slate-200 bg-white shadow-sm ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{sourceTitle(memory)}</h3>
          {'created_at' in memory && <p className="mt-1 text-xs text-slate-500">{formatDate(memory.created_at)}</p>}
        </div>
        {'status' in memory && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {memory.status === 'completed' ? 'Ready' : memory.status === 'pending' ? 'Understanding' : memory.status}
          </span>
        )}
      </div>
      <p className={`mt-3 text-sm leading-6 text-slate-600 ${compact ? 'line-clamp-2' : 'line-clamp-4'}`}>
        {sourceSummary(memory)}
      </p>
      {(people.length > 0 || places.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium">
          {people.slice(0, 3).map((person) => (
            <span key={person} className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
              {person}
            </span>
          ))}
          {places.slice(0, 3).map((place) => (
            <span key={place} className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
              {place}
            </span>
          ))}
        </div>
      )}
      {(onArchive || onDelete) && (
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          {onArchive && (
            <button onClick={() => onArchive(memory.memory_id)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-cyan-50 hover:text-cyan-700">
              Archive
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(memory.memory_id)} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProcessingJourney({ activeIndex, mode, error }: { activeIndex: number; mode: StudioMode; error?: string | null }) {
  if (!mode) return null;
  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/80 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950">
            {mode === 'sample' ? 'Organizing sample memories' : 'Understanding this memory'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {journeyStages[Math.min(activeIndex, journeyStages.length - 1)]}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
          {error ? 'Needs attention' : activeIndex >= journeyStages.length - 1 ? 'Ready' : 'Working'}
        </span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-6">
        {journeyStages.map((stage, index) => {
          const done = activeIndex > index;
          const active = activeIndex === index;
          return (
            <div
              key={stage}
              className={`rounded-lg border px-3 py-3 text-xs font-semibold transition ${
                done
                  ? 'border-cyan-500 bg-cyan-600 text-white'
                  : active
                    ? 'border-cyan-400 bg-white text-cyan-800 shadow-sm ring-4 ring-cyan-100'
                    : 'border-white bg-white/70 text-slate-500'
              }`}
            >
              <span
                className={`mb-2 block h-2 w-2 rounded-full ${
                  active ? 'animate-pulse bg-cyan-500' : done ? 'bg-white' : 'bg-slate-300'
                }`}
              />
              {stage}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}

export default function MemoryExperience({ surface }: { surface: MemorySurface }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [graph, setGraph] = useState<GraphResponse>({ nodes: [], links: [] });
  const [timeline, setTimeline] = useState<TimelineYear[]>([]);
  const [storySessions, setStorySessions] = useState<StorySessionSummary[]>([]);
  const [storyMessages, setStoryMessages] = useState<StoryMessage[]>([]);
  const [activeStorySession, setActiveStorySession] = useState<StorySessionSummary | null>(null);
  const [storyAnswer, setStoryAnswer] = useState('');
  const [peopleProfiles, setPeopleProfiles] = useState<PersonProfileSummary[]>([]);
  const [familyRelationships, setFamilyRelationships] = useState<FamilyRelationshipItem[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReportDraft[]>([]);
  const [reportRecipients, setReportRecipients] = useState<ReportRecipientItem[]>([]);
  const [storybooks, setStorybooks] = useState<StorybookItem[]>([]);
  const [legacyPayload, setLegacyPayload] = useState<LegacyPayload | null>(null);
  const [carePayload, setCarePayload] = useState<CarePayload | null>(null);
  const [memoryProofs, setMemoryProofs] = useState<MemoryProofItem[]>([]);
  const [lifeChapters, setLifeChapters] = useState<LifeChaptersPayload | null>(null);
  const [lifeChapterPerson, setLifeChapterPerson] = useState('');
  const [familyRituals, setFamilyRituals] = useState<FamilyRitualItem[]>([]);
  const [memoryCapsules, setMemoryCapsules] = useState<MemoryCapsuleItem[]>([]);
  const [legacyContacts, setLegacyContacts] = useState<LegacyContactItem[]>([]);
  const [trustPayload, setTrustPayload] = useState<TrustPayload | null>(null);
  const [oneLifeStory, setOneLifeStory] = useState<OneLifeStoryPayload | null>(null);
  const [presenceResponse, setPresenceResponse] = useState<PresencePayload | null>(null);
  const [presencePerson, setPresencePerson] = useState('');
  const [presenceQuestion, setPresenceQuestion] = useState('What advice would you give the family?');
  const [lifeMapSnapshots, setLifeMapSnapshots] = useState<LifeMapSnapshotItem[]>([]);
  const [question, setQuestion] = useState('What memories involve grandfather?');
  const [assistantResponse, setAssistantResponse] = useState<ChatResponse | null>(null);
  const [assistantResults, setAssistantResults] = useState<SearchResult[]>([]);
  const [timeQuery, setTimeQuery] = useState("Show my father's life between age 20-30");
  const [birthYear, setBirthYear] = useState('1978');
  const [timeResponse, setTimeResponse] = useState<TimeMachineResponse | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<MemoryStatusResponse | null>(null);
  const [studioMode, setStudioMode] = useState<StudioMode>(null);
  const [sampleStageIndex, setSampleStageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveIntelligence, setArchiveIntelligence] = useState<ArchiveIntelligence | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [graphSelectedNode, setGraphSelectedNode] = useState<string | null>(null);
  const [personPortrait, setPersonPortrait] = useState<{ person: string; portrait: string; proofs?: MemoryProofItem[] } | null>(null);
  const [proofPreview, setProofPreview] = useState<MemoryProofItem | null>(null);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [processingCount, setProcessingCount] = useState(0);

  const deprecatedDest = DEPRECATED_SURFACE_REDIRECTS[surface];

  useEffect(() => {
    if (isLoading || user) return;
    if (pathname.startsWith('/auth/')) return;
    router.replace(loginPathWithNext(pathname));
  }, [isLoading, user, pathname, router]);

  useEffect(() => {
    if (!deprecatedDest || isLoading || !user) return;
    if (pathname === deprecatedDest) return;
    router.replace(deprecatedDest);
  }, [deprecatedDest, isLoading, user, pathname, router]);

  useEffect(() => {
    if (!isLoading && user) setShowOnboarding(!isOnboardingComplete());
  }, [isLoading, user]);

  const welcomeChecked = useRef(false);
  useEffect(() => {
    if (welcomeChecked.current) return;
    if (!isLoading && user && surface === 'studio' && !loading && shouldShowWelcome()) {
      welcomeChecked.current = true;
      setShowWelcome(true);
    }
  }, [isLoading, user, surface, loading]);

  const apiJson = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const response = await fetch(`${API_URL}${path}`, {
        ...init,
        credentials: 'include',
        headers: authHeaders(init.headers),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`${path} failed with ${response.status}: ${body}`);
      }
      return response.json();
    },
    [],
  );

  const hasArchiveData = useRef(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    if (!hasArchiveData.current) setLoading(true);
    setError(null);
    try {
      const archiveOwner = getArchiveOwnerId();
      const bootstrapPath = archiveOwner ? `/bootstrap?owner_id=${encodeURIComponent(archiveOwner)}` : '/bootstrap';
      const [boot, legacyData, careData, trustData, oneLifeData] = await Promise.all([
        apiJson<BootstrapPayload>(bootstrapPath),
        apiJson<LegacyPayload>('/legacy/score'),
        apiJson<CarePayload>('/care/signals'),
        apiJson<TrustPayload>('/trust/local-ai'),
        apiJson<OneLifeStoryPayload>('/demo/one-life-story'),
      ]);
      setInsights(boot.insights);
      setMemories(boot.memories);
      setGraph(boot.graph);
      setTimeline(boot.timeline.filter((item) => item.year > 0));
      setStorySessions(boot.story_sessions);
      setPeopleProfiles(boot.people);
      setFamilyRelationships(boot.family_relationships);
      setWeeklyReports(boot.weekly_reports);
      setReportRecipients(boot.report_recipients);
      setStorybooks(boot.storybooks);
      setLegacyPayload(legacyData);
      setCarePayload(careData);
      setMemoryProofs(boot.memory_proofs?.proofs || []);
      setFamilyRituals(boot.family_rituals);
      setMemoryCapsules(boot.memory_capsules);
      setLegacyContacts(boot.legacy_contacts);
      setTrustPayload(trustData);
      setOneLifeStory(oneLifeData);
      setLifeMapSnapshots(boot.life_map_snapshots);
      setArchiveIntelligence(boot.archive_intelligence);
      setProcessingCount(boot.processing_queue?.length ?? 0);
      hasArchiveData.current = true;
      if (boot.memories.length > 0 && onboardingStep < 1) setOnboardingStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [apiJson, onboardingStep, user]);

  const loadedForUserId = useRef<string | null>(null);
  useEffect(() => {
    if (!user) {
      loadedForUserId.current = null;
      hasArchiveData.current = false;
      return;
    }
    if (loadedForUserId.current === user.id) return;
    loadedForUserId.current = user.id;
    void loadAll();
  }, [user, loadAll]);

  useEffect(() => {
    const onArchiveChange = () => {
      hasArchiveData.current = false;
      void loadAll();
    };
    window.addEventListener(ARCHIVE_CHANGE_EVENT, onArchiveChange);
    return () => window.removeEventListener(ARCHIVE_CHANGE_EVENT, onArchiveChange);
  }, [loadAll]);

  useEffect(() => {
    if (studioMode !== 'sample') return;
    const id = window.setInterval(() => {
      setSampleStageIndex((value) => Math.min(value + 1, journeyStages.length - 1));
    }, 420);
    return () => window.clearInterval(id);
  }, [studioMode]);

  useEffect(() => {
    const father = peopleProfiles.find((profile) => profile.name === 'Father');
    const year = father?.metadata?.birth_year;
    if (year && !birthYear.trim()) {
      setBirthYear(String(year));
    }
  }, [peopleProfiles, birthYear]);

  const seedArchive = useCallback(
    async (silent = false) => {
      setBusyAction(SEED_BUSY);
      setStudioMode('sample');
      setSampleStageIndex(0);
      if (!silent) setNotice(null);
      setError(null);
      try {
        await Promise.all([
          apiJson('/sample-archive/load', { method: 'POST' }),
          new Promise((resolve) => window.setTimeout(resolve, silent ? 1800 : 2600)),
        ]);
        setSampleStageIndex(journeyStages.length - 1);
        await loadAll();
        setOnboardingStep(1);
        if (!silent) setNotice('Sample Patel family archive loaded — try Ask about grandfather in Mumbai.');
        if (!silent && pathname !== '/studio') router.push('/studio');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
        window.setTimeout(() => setStudioMode(null), 900);
      }
    },
    [apiJson, loadAll, pathname, router],
  );

  const autoSeedStarted = useRef(false);
  useEffect(() => {
    if (!AUTO_SEED_ENABLED || loading || !user || memories.length > 0 || autoSeedStarted.current) return;
    if (typeof window !== 'undefined' && window.localStorage.getItem(AUTO_SEED_KEY) === 'done') return;
    autoSeedStarted.current = true;
    if (typeof window !== 'undefined') window.localStorage.setItem(AUTO_SEED_KEY, 'done');
    void (async () => {
      await seedArchive(true);
      setNotice(AUTO_SEED_HINT);
    })();
  }, [loading, user, memories.length, seedArchive]);

  const uploadMemory = async () => {
    if (!uploadFile || !user) return;
    setBusyAction('Adding memory');
    setStudioMode('upload');
    setNotice(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const archiveOwner = getArchiveOwnerId();
      if (archiveOwner) formData.append('archive_owner_id', archiveOwner);
      const response = await fetch(`${API_URL}/memories/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: formData,
      });
      if (!response.ok) throw new Error(`Upload failed with ${response.status}: ${await response.text()}`);
      const uploaded = (await response.json()) as UploadResponse;
      setUploadStatus(uploaded);
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        const status = await apiJson<MemoryStatusResponse>(`/memories/${uploaded.memory_id}/status`);
        setUploadStatus(status);
        if (status.status === 'completed' || status.status === 'failed') break;
      }
      setUploadFile(null);
      await loadAll();
      setNotice('Memory added and connected.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  };

  const askArchive = async (nextQuestion = question) => {
    const query = nextQuestion.trim();
    if (!query) return;
    setQuestion(query);
    setBusyAction(ASK_BUSY);
    setError(null);
    setStreamingAnswer('');
    setAssistantResponse(null);
    try {
      const searchData = await apiJson<SearchResponse>(`/memories/search?query=${encodeURIComponent(query)}&limit=6`);
      setAssistantResults(searchData.results);

      let chatData: ChatResponse | null = null;
      try {
        const streamResponse = await fetch(`${API_URL}/chat/stream`, {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ query }),
        });
        if (streamResponse.ok && streamResponse.body) {
          const reader = streamResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let answer = '';
          let proofs: MemoryProofItem[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = JSON.parse(line.slice(6)) as {
                type: string;
                text?: string;
                answer?: string;
                proofs?: MemoryProofItem[];
              };
              if (payload.type === 'meta' && payload.proofs) proofs = payload.proofs;
              if (payload.type === 'token' && payload.text) {
                answer += payload.text;
                setStreamingAnswer(answer);
              }
              if (payload.type === 'done' && payload.answer) answer = payload.answer;
            }
          }
          chatData = { answer, sources: [], relationships: [], proofs };
        }
      } catch {
        chatData = null;
      }

      if (!chatData) {
        chatData = await apiJson<ChatResponse>('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
      }

      setAssistantResponse(chatData);
      setStreamingAnswer('');
      setOnboardingStep((value) => Math.max(value, 2));
      router.push('/ask');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  };

  const resolveArchiveInsight = useCallback(
    async (insightKey: string, action: 'dismiss' | 'merge', mergeTarget?: string) => {
      const data = await apiJson<{ intelligence: ArchiveIntelligence }>('/archive/intelligence/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight_key: insightKey, action, merge_target: mergeTarget }),
      });
      setArchiveIntelligence(data.intelligence);
      setNotice(action === 'dismiss' ? 'Insight dismissed.' : 'Merge recorded.');
    },
    [apiJson],
  );

  const exportProofReport = useCallback(
    async (format: 'html' | 'pdf' = 'html') => {
      if (!assistantResponse) return;
      setBusyAction('Exporting proof report');
      try {
        const response = await fetch(`${API_URL}/proof/export`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer: assistantResponse.answer,
            query: question,
            proofs: assistantResponse.proofs || [],
            format,
          }),
        });
        if (!response.ok) throw new Error(await response.text());
        const blob = await response.blob();
        downloadBlob(`memory-proof-report.${format === 'pdf' ? 'pdf' : 'html'}`, blob);
        setNotice('Sources report downloaded.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [assistantResponse, question],
  );

  const runTimeMachine = async (nextQuery = timeQuery) => {
    const query = nextQuery.trim();
    if (!query) return;
    setTimeQuery(query);
    setBusyAction(CHAPTER_BUSY);
    setError(null);
    try {
      const archiveOwner = getArchiveOwnerId();
      const fatherProfile = peopleProfiles.find((p) => p.name === 'Father');
      const profileBirthYear = fatherProfile?.metadata?.birth_year;
      const parsedBirthYear = birthYear.trim()
        ? Number(birthYear)
        : profileBirthYear
          ? Number(profileBirthYear)
          : undefined;
      const data = await apiJson<TimeMachineResponse>('/time-machine/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          birth_year: Number.isFinite(parsedBirthYear) ? parsedBirthYear : undefined,
          owner_id: archiveOwner || undefined,
        }),
      });
      setTimeResponse(data);
      setOnboardingStep((value) => Math.max(value, 3));
      markOnboardingComplete();
      router.push('/time-machine');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  };

  const topPeople = useMemo(() => insights?.top_people?.slice(0, 8) || [], [insights?.top_people]);
  const topPlaces = useMemo(() => graph.nodes.filter((node) => node.group === 'place').slice(0, 8), [graph.nodes]);
  const storyEvents = useMemo(() => graph.nodes.filter((node) => node.group === 'event').slice(0, 8), [graph.nodes]);
  const hasArchive = memories.length > 0;
  const uploadJourneyIndex = uploadStatus ? uploadStageIndex[uploadStatus.processing_stage] ?? 0 : 0;
  const activeJourneyIndex = studioMode === 'sample' ? sampleStageIndex : uploadJourneyIndex;
  const assistantSources = assistantResponse?.sources?.length ? assistantResponse.sources : assistantResults;
  const assistantPeople = unique(assistantSources.flatMap((memory) => memory.structured_data?.people || [])).slice(0, 6);
  const assistantPlaces = unique(assistantSources.flatMap((memory) => memory.structured_data?.places || [])).slice(0, 6);
  const primaryPerson = topPeople[0]?.[0] || 'Father';
  const secondaryPerson = topPeople[1]?.[0] || 'Grandfather';
  const primaryPlace = topPlaces[0]?.label || 'Mumbai';
  const lifeScore = Math.min(100, memories.length * 2 + graph.links.length + timeline.length * 4 + topPeople.length * 5);
  const legacyStage =
    lifeScore > 85 ? 'Redwood' : lifeScore > 65 ? 'Oak' : lifeScore > 42 ? 'Banyan' : lifeScore > 20 ? 'Sapling' : 'Seedling';

  const heartfeltMemories = memories
    .filter((memory) => /love|proud|miss|grateful|family|father|grandfather|mother|home|remember/i.test(`${memory.title} ${memory.summary}`))
    .slice(0, 8);
  const fallbackHeartMessages = [
    {
      title: 'A family thread worth preserving',
      summary: `${secondaryPerson} and ${primaryPerson} appear as emotional anchors in this archive.`,
      memory_id: 'fallback-heart-1',
      status: 'ready',
    },
    {
      title: 'A place that holds memory',
      summary: `${primaryPlace} connects multiple memories into a single family chapter.`,
      memory_id: 'fallback-heart-2',
      status: 'ready',
    },
  ] as MemoryItem[];
  const messageCards = heartfeltMemories.length ? heartfeltMemories : fallbackHeartMessages;
  const weeklyReport = useMemo(
    () => buildWeeklyReport({ memories, topPeople, topPlaces, storyEvents, timeline, messageCards }),
    [memories, topPeople, topPlaces, storyEvents, timeline, messageCards],
  );

  const exportArchive = useCallback(
    async (format: 'json' | 'csv' | 'html') => {
      const exportPath =
        format === 'json' ? '/exports/archive.json' : format === 'csv' ? '/exports/relationships.csv' : '/exports/family-report.html';
      const filename =
        format === 'json'
          ? 'memorygraph-family-archive.json'
          : format === 'csv'
            ? 'memorygraph-relationships.csv'
            : 'memorygraph-family-report.html';
      try {
        const response = await fetch(`${API_URL}${exportPath}`, { credentials: 'include' });
        if (!response.ok) throw new Error(await response.text());
        downloadBlob(filename, await response.blob());
        setNotice(`Downloaded ${format.toUpperCase()} family archive.`);
        return;
      } catch {
        // Keep a local export fallback so families never lose the ability to take their data.
      }

      const generatedAt = new Date().toISOString();
      const payload = {
        generated_at: generatedAt,
        owner: user?.email || 'MemoryGraph user',
        summary: {
          memories: memories.length,
          people: topPeople.length,
          places: topPlaces.length,
          events: storyEvents.length,
          timeline_years: timeline.length,
          relationships: graph.links.length,
        },
        people: topPeople.map(([name, count]) => ({ name, memory_signals: count })),
        places: topPlaces.map((place) => ({ id: place.id, label: place.label })),
        events: storyEvents.map((event) => ({ id: event.id, label: event.label })),
        timeline,
        relationships: graph.links,
        memories,
      };

      if (format === 'json') {
        downloadTextFile('memorygraph-family-archive.json', JSON.stringify(payload, null, 2), 'application/json');
      }

      if (format === 'csv') {
        const rows = [
          ['source', 'relationship', 'target'],
          ...graph.links.map((link) => [link.source, link.label.replaceAll('_', ' '), link.target]),
        ];
        downloadTextFile(
          'memorygraph-relationships.csv',
          rows.map((row) => row.map((cell) => csvCell(cell)).join(',')).join('\n'),
          'text/csv',
        );
      }

      if (format === 'html') {
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>MemoryGraph Family Archive</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#0f172a}h1{font-size:36px}.card{border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin:12px 0}.muted{color:#64748b}</style></head><body><h1>MemoryGraph Family Archive</h1><p class="muted">Generated ${escapeHtml(generatedAt)}</p><div class="card"><strong>${memories.length}</strong> memories, <strong>${graph.links.length}</strong> relationships, <strong>${timeline.length}</strong> timeline years.</div><h2>People</h2>${payload.people.map((person) => `<div class="card">${escapeHtml(person.name)} · ${person.memory_signals} signals</div>`).join('')}<h2>Places</h2>${payload.places.map((place) => `<div class="card">${escapeHtml(place.label)}</div>`).join('')}<h2>Memories</h2>${memories.map((memory) => `<div class="card"><h3>${escapeHtml(memory.title)}</h3><p>${escapeHtml(memory.summary || memory.raw_text || '')}</p></div>`).join('')}</body></html>`;
        downloadTextFile('memorygraph-family-report.html', html, 'text/html');
      }

      setNotice(`Exported ${format.toUpperCase()} family archive.`);
    },
    [graph.links, memories, storyEvents, timeline, topPeople, topPlaces, user?.email],
  );

  const copyWeeklyReport = useCallback(async () => {
    try {
      const report = await apiJson<{ body: string }>('/reports/weekly');
      await navigator.clipboard.writeText(report.body);
    } catch {
      await navigator.clipboard.writeText(weeklyReport);
    }
    setNotice('Weekly family update copied.');
  }, [apiJson, weeklyReport]);

  const emailWeeklyReport = useCallback(() => {
    void apiJson<{ mailto: string }>('/reports/weekly')
      .then((report) => {
        window.location.href = report.mailto;
      })
      .catch(() => {
        window.location.href = `mailto:?subject=${encodeURIComponent('This Week in Your Family Archive')}&body=${encodeURIComponent(weeklyReport)}`;
      });
  }, [apiJson, weeklyReport]);

  const createFamilyInvite = useCallback(async () => {
    setBusyAction('Preparing family invite');
    try {
      const invite = await apiJson<{ invite_link: string }>('/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_name: 'Family member', relationship: 'Family', expires_days: 30 }),
      });
      const absoluteLink = `${window.location.origin}${invite.invite_link}`;
      setInviteLink(absoluteLink);
      await navigator.clipboard.writeText(absoluteLink);
      setNotice('Family invite link copied.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }, [apiJson]);

  const archiveMemory = useCallback(
    async (memoryId: string) => {
      setBusyAction('Archiving memory');
      try {
        await apiJson(`/memories/${memoryId}/archive`, { method: 'POST' });
        await loadAll();
        setNotice('Memory archived.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      setBusyAction('Deleting memory');
      try {
        await apiJson(`/memories/${memoryId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Removed from Studio' }),
        });
        await loadAll();
        setNotice('Memory deleted from active archive.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const startStorySession = useCallback(
    async (mode: string) => {
      setBusyAction('Opening Story Companion');
      setError(null);
      try {
        const session = await apiJson<StorySessionSummary>('/story-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, title: `${mode} Story Session` }),
        });
        setActiveStorySession(session);
        setStoryMessages([{ role: 'assistant', content: session.next_question || 'What story should we preserve first?' }]);
        await loadAll();
        router.push('/story-companion');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll, router],
  );

  const sendStoryAnswer = useCallback(async () => {
    if (!activeStorySession || !storyAnswer.trim()) return;
    setBusyAction('Listening to your story');
    setError(null);
    try {
      const response = await apiJson<{ messages: StoryMessage[]; next_question: string }>(`/story-sessions/${activeStorySession.session_id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: storyAnswer }),
      });
      setStoryMessages(response.messages);
      setStoryAnswer('');
      setActiveStorySession({ ...activeStorySession, next_question: response.next_question, message_count: response.messages.length });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }, [activeStorySession, apiJson, loadAll, storyAnswer]);

  const saveStorySession = useCallback(async () => {
    if (!activeStorySession) return;
    setBusyAction('Saving story as memory');
    setError(null);
    try {
      await apiJson(`/story-sessions/${activeStorySession.session_id}/save-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: activeStorySession.title }),
      });
      setNotice('Story saved as a real memory and connected to the archive.');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }, [activeStorySession, apiJson, loadAll]);

  const createFamilyRelationship = useCallback(
    async (payload: { person_a: string; relation: string; person_b: string; notes?: string }) => {
      setBusyAction('Saving relationship');
      try {
        await apiJson('/family-relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await loadAll();
        setNotice('Family relationship saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const deleteFamilyRelationship = useCallback(
    async (relationshipId: string) => {
      setBusyAction('Removing relationship');
      try {
        await apiJson(`/family-relationships/${relationshipId}`, { method: 'DELETE' });
        await loadAll();
        setNotice('Family relationship removed.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const createWeeklyReportDraft = useCallback(
    async (recipientType: string) => {
      setBusyAction('Writing weekly letter');
      try {
        await apiJson('/reports/weekly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_type: recipientType }),
        });
        await loadAll();
        setNotice('Weekly family letter saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const shareWeeklyReport = useCallback(
    async (reportId: string) => {
      setBusyAction('Creating public letter link');
      try {
        const share = await apiJson<{ share_link: string }>(`/reports/weekly/${reportId}/share`, { method: 'POST' });
        const link = `${window.location.origin}${share.share_link}`;
        await navigator.clipboard.writeText(link);
        await loadAll();
        setNotice(`Public report link copied: ${link}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const createStorybook = useCallback(
    async (style: string, query = '') => {
      setBusyAction('Creating storybook');
      try {
        await apiJson('/storybooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ style, query, title: 'A Whole Life, Beautifully Told' }),
        });
        await loadAll();
        setNotice('Storybook created.');
        router.push('/storyboards');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll, router],
  );

  const shareStorybook = useCallback(
    async (storybookId: string) => {
      setBusyAction('Creating storybook link');
      try {
        const share = await apiJson<{ share_link: string }>(`/storybooks/${storybookId}/share`, { method: 'POST' });
        const link = `${window.location.origin}${share.share_link}`;
        await navigator.clipboard.writeText(link);
        await loadAll();
        setNotice(`Storybook link copied: ${link}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const exportStorybook = useCallback(
    async (storybookId: string, title: string) => {
      setBusyAction('Exporting storybook');
      try {
        const response = await fetch(`${API_URL}/storybooks/${storybookId}/export.html`, { credentials: 'include' });
        if (!response.ok) throw new Error(await response.text());
        downloadBlob(`${title.toLowerCase().replaceAll(' ', '_')}_storybook.html`, await response.blob());
        setNotice('Storybook exported.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [],
  );

  const updatePersonProfile = useCallback(
    async (person: string, payload: { role?: string; biography?: string; photo_url?: string; birth_year?: string; notes?: string }) => {
      setBusyAction('Saving person profile');
      try {
        await apiJson(`/people/${encodeURIComponent(person)}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await loadAll();
        setNotice('Person profile saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const shareFamilyTree = useCallback(async () => {
    setBusyAction('Creating family tree link');
    try {
      const share = await apiJson<{ share_link: string }>('/family-tree/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'MemoryGraph Family Tree' }),
      });
      const link = `${window.location.origin}${share.share_link}`;
      await navigator.clipboard.writeText(link);
      setNotice(`Family tree link copied: ${link}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }, [apiJson]);

  const saveLifeMapSnapshot = useCallback(
    async (person?: string) => {
      setBusyAction('Saving life map');
      try {
        await apiJson('/life-map/snapshots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ person, title: `${person || 'Family'} Life Map` }),
        });
        await loadAll();
        setNotice('Life map snapshot saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const createReportRecipient = useCallback(
    async (payload: { name: string; email: string; relationship?: string; cadence?: string }) => {
      setBusyAction('Saving report recipient');
      try {
        await apiJson('/report-recipients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await loadAll();
        setNotice('Report recipient saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const sendReportDraft = useCallback(
    async (reportId: string) => {
      setBusyAction('Preparing family delivery');
      try {
        await apiJson(`/reports/weekly/${reportId}/send`, { method: 'POST' });
        setNotice('Weekly report delivery drafted for saved recipients.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson],
  );

  const askPresence = useCallback(
    async (person?: string, mode = 'Advice') => {
      const target = (person || presencePerson || primaryPerson).trim();
      const query = presenceQuestion.trim() || 'What should family remember?';
      setBusyAction('Reconstructing presence');
      try {
        const data = await apiJson<PresencePayload>(`/presence/${encodeURIComponent(target)}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: query, mode }),
        });
        setPresenceResponse(data);
        setPresencePerson(data.person);
        router.push('/presence');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, presencePerson, presenceQuestion, primaryPerson, router],
  );

  const buildLifeChapters = useCallback(
    async (person?: string) => {
      const target = (person || lifeChapterPerson || primaryPerson).trim();
      setBusyAction('Building life chapters');
      setError(null);
      try {
        const data = await apiJson<LifeChaptersPayload>('/life-chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ person: target }),
        });
        setLifeChapters(data);
        setLifeChapterPerson(data.person);
        router.push('/life-chapters');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, lifeChapterPerson, primaryPerson, router],
  );

  const exportBiography = useCallback(
    async (person?: string) => {
      const target = (person || lifeChapterPerson || primaryPerson).trim();
      setBusyAction('Exporting biography');
      try {
        const response = await fetch(`${API_URL}/biography/export.html?person=${encodeURIComponent(target)}`, { credentials: 'include' });
        if (!response.ok) throw new Error(await response.text());
        downloadBlob(`${target.toLowerCase().replaceAll(' ', '_')}_memorygraph_biography.html`, await response.blob());
        setNotice('Biography exported.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [lifeChapterPerson, primaryPerson],
  );

  const shareOneLifeStory = useCallback(async () => {
    setBusyAction('Creating public story link');
    try {
      const share = await apiJson<{ share_link: string }>('/one-life-story/share', { method: 'POST' });
      const link = `${window.location.origin}${share.share_link}`;
      await navigator.clipboard.writeText(link);
      setNotice(`One Life Story link copied: ${link}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(null);
    }
  }, [apiJson]);

  const respondToRitual = useCallback(
    async (ritualId: string, question: string, answer: string) => {
      setBusyAction('Saving ritual memory');
      try {
        await apiJson(`/family-rituals/${ritualId}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, answer }),
        });
        await loadAll();
        setNotice('Ritual answer saved as a new memory.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const emailRitual = useCallback(
    async (ritualId: string) => {
      setBusyAction('Sending ritual email');
      try {
        const result = await apiJson<{ sent: boolean }>(`/family-rituals/${ritualId}/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        setNotice(result.sent ? 'Ritual questions emailed.' : 'Email not sent — configure GMAIL_* in backend .env');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson],
  );

  const loadPersonPortrait = useCallback(
    async (personName: string) => {
      setBusyAction('Writing portrait');
      try {
        const data = await apiJson<{ person: string; portrait: string; proofs?: MemoryProofItem[] }>(
          `/people/${encodeURIComponent(personName)}/portrait`,
        );
        setPersonPortrait(data);
        setNotice(`Portrait ready for ${personName}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson],
  );

  const createFamilyRitual = useCallback(
    async (title = 'Sunday Memory Night') => {
      setBusyAction('Creating family ritual');
      try {
        await apiJson('/family-rituals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, cadence: 'weekly' }),
        });
        await loadAll();
        setNotice('Family ritual created.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const createMemoryCapsule = useCallback(
    async (payload: { title: string; message: string; recipient_name?: string; recipient_email?: string; unlock_at?: string }) => {
      setBusyAction('Sealing memory capsule');
      try {
        const capsule = await apiJson<{ share_link: string }>('/memory-capsules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const link = `${window.location.origin}${capsule.share_link}`;
        await navigator.clipboard.writeText(link);
        await loadAll();
        setNotice(`Capsule link copied: ${link}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const createLegacyContact = useCallback(
    async (payload: { name: string; email: string; relationship?: string; permissions: string[] }) => {
      setBusyAction('Saving legacy contact');
      try {
        await apiJson('/legacy-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await loadAll();
        setNotice('Legacy contact saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyAction(null);
      }
    },
    [apiJson, loadAll],
  );

  const pageMeta = pageMetaForSurface(surface);
  const showPageHero = surface !== 'studio' && surface !== 'stories';
  const deprecatedRedirect = deprecatedDest;

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0df] p-6 text-slate-950">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">MemoryGraph</h1>
          <p className="mt-2 text-sm text-slate-600">{isLoading ? LOADING_APP : LOADING_SIGN_IN}</p>
        </div>
      </main>
    );
  }

  if (deprecatedRedirect) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0df] p-6 text-slate-600">
        {LOADING_APP}
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f0df] text-slate-950">
      {showWelcome && surface === 'studio' && (
        <WelcomeModal memoryCount={memories.length} onDismiss={() => setShowWelcome(false)} />
      )}
      <div className="pointer-events-none fixed inset-0">
        <Image
          src={familyImages[4].src}
          alt=""
          fill
          sizes={PAGE_BG_IMAGE_SIZES}
          loading="lazy"
          className="object-cover opacity-[0.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#f6f0df]/98 via-white/92 to-amber-50/40" />
      </div>
      <AppShell
        surface={surface}
        userName={user?.full_name}
        userEmail={user?.email}
        onLogout={logout}
        hero={
          showPageHero ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{pageMeta.title}</h2>
              <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">{pageMeta.description}</p>
              {hasArchive && (
                <p className="mt-3 text-sm text-slate-500">
                  {memories.length} memories · {topPeople.length} people · {primaryPlace}
                </p>
              )}
            </section>
          ) : undefined
        }
      >
            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1' ? (
              <JudgeModeBanner memoryCount={memories.length} authed={!!user} />
            ) : null}

            <StatusBanner busy={busyAction} notice={notice} error={error} />

            <SubNavTabs surface={surface} />

            {surface === 'stories' && (
              <StoriesHubSurface memoryCount={memories.length} onSeed={() => void seedArchive()} busy={!!busyAction} />
            )}
            {surface === 'studio' && (
              <>
                {showOnboarding && !showWelcome && (
                  <OnboardingWizard
                    step={onboardingStep}
                    memoryCount={memories.length}
                    onSeed={() => void seedArchive()}
                    onAskProof={() => void askArchive('What do we know about grandfather?')}
                    onTimeMachine={() => void runTimeMachine("Show my father's life between age 20-30")}
                    onDismiss={() => {
                      markOnboardingComplete();
                      setShowOnboarding(false);
                    }}
                    busy={!!busyAction}
                  />
                )}
                <SampleArchiveBanner
                  memoryCount={memories.length}
                  onLoadSample={() => void seedArchive()}
                  busy={!!busyAction}
                />
                <HomeDashboard
                  memoryCount={memories.length}
                  peopleCount={peopleProfiles.length}
                  yearSpan={
                    timeline.length > 0
                      ? `${Math.min(...timeline.map((t) => t.year))}–${Math.max(...timeline.map((t) => t.year))}`
                      : ''
                  }
                  processingCount={processingCount}
                  recentMemories={memories}
                  onAsk={() => router.push('/ask')}
                  onUploadFocus={() => document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })}
                />
                <ArchiveInsightsCard data={archiveIntelligence} onAction={resolveArchiveInsight} />
                {insights?.duplicates?.length ? (
                  <DuplicateMergePanel duplicates={insights.duplicates} onMerged={() => void loadAll()} />
                ) : null}
                <StudioSurface
                  memories={memories}
                  graph={graph}
                  memoryProofs={memoryProofs}
                  graphSelectedNode={graphSelectedNode}
                  setGraphSelectedNode={setGraphSelectedNode}
                  timeline={timeline}
                  topPeople={topPeople}
                  topPlaces={topPlaces}
                  storyEvents={storyEvents}
                  uploadFile={uploadFile}
                  setUploadFile={setUploadFile}
                  uploadMemory={uploadMemory}
                  seedArchive={seedArchive}
                  busyAction={busyAction}
                  studioMode={studioMode}
                  activeJourneyIndex={activeJourneyIndex}
                  uploadError={uploadStatus?.processing_error}
                  askArchive={askArchive}
                  runTimeMachine={runTimeMachine}
                  legacyStage={legacyStage}
                  exportArchive={exportArchive}
                  createFamilyInvite={createFamilyInvite}
                  inviteLink={inviteLink}
                  archiveMemory={archiveMemory}
                  deleteMemory={deleteMemory}
                />
              </>
            )}
            {surface === 'ask' && (
              <AskSurface
                question={question}
                setQuestion={setQuestion}
                askArchive={askArchive}
                exportProofReport={exportProofReport}
                runTimeMachine={runTimeMachine}
                busyAction={busyAction}
                assistantResponse={assistantResponse}
                assistantSources={assistantSources}
                assistantPeople={assistantPeople}
                assistantPlaces={assistantPlaces}
                streamingAnswer={streamingAnswer}
                onProofClick={setProofPreview}
              />
            )}
            {surface === 'story-companion' && (
              <StoryCompanionSurface
                sessions={storySessions}
                activeSession={activeStorySession}
                messages={storyMessages}
                answer={storyAnswer}
                setAnswer={setStoryAnswer}
                startSession={startStorySession}
                sendAnswer={sendStoryAnswer}
                saveSession={saveStorySession}
                busyAction={busyAction}
              />
            )}
            {surface === 'presence' && (
              <PresenceSurface
                people={peopleProfiles}
                person={presencePerson || primaryPerson}
                setPerson={setPresencePerson}
                question={presenceQuestion}
                setQuestion={setPresenceQuestion}
                response={presenceResponse}
                askPresence={askPresence}
                busyAction={busyAction}
              />
            )}
            {surface === 'people' && (
              <PeopleSurface
                people={peopleProfiles}
                askArchive={askArchive}
                portrait={personPortrait}
                loadPortrait={loadPersonPortrait}
                busyAction={busyAction}
              />
            )}
            {surface === 'family-tree' && (
              <FamilyTreeSurface
                topPeople={topPeople}
                peopleProfiles={peopleProfiles}
                relationships={familyRelationships}
                graph={graph}
                memories={memories}
                memoryProofs={memoryProofs}
                graphSelectedNode={graphSelectedNode}
                setGraphSelectedNode={setGraphSelectedNode}
                askArchive={askArchive}
                runTimeMachine={runTimeMachine}
                primaryPerson={primaryPerson}
                secondaryPerson={secondaryPerson}
                exportArchive={exportArchive}
                createRelationship={createFamilyRelationship}
                deleteRelationship={deleteFamilyRelationship}
                updatePersonProfile={updatePersonProfile}
                shareFamilyTree={shareFamilyTree}
              />
            )}
            {surface === 'life-map' && (
              <LifeMapSurface
                topPeople={topPeople}
                topPlaces={topPlaces}
                storyEvents={storyEvents}
                timeline={timeline}
                graph={graph}
                askArchive={askArchive}
                exportArchive={exportArchive}
                saveLifeMapSnapshot={saveLifeMapSnapshot}
                snapshots={lifeMapSnapshots}
              />
            )}
            {surface === 'time-machine' && (
              <TimeMachineSurface
                timeQuery={timeQuery}
                setTimeQuery={setTimeQuery}
                birthYear={birthYear}
                setBirthYear={setBirthYear}
                runTimeMachine={runTimeMachine}
                busyAction={busyAction}
                timeResponse={timeResponse}
                memoryCount={memories.length}
                onLoadSample={() => void seedArchive()}
              />
            )}
            {surface === 'messages' && <MessagesSurface messages={messageCards} askArchive={askArchive} />}
            {surface === 'storyboards' && (
              <StoryboardsSurface
                memories={memories}
                topPeople={topPeople}
                topPlaces={topPlaces}
                runTimeMachine={runTimeMachine}
                storybooks={storybooks}
                createStorybook={createStorybook}
                shareStorybook={shareStorybook}
                exportStorybook={exportStorybook}
              />
            )}
            {surface === 'legacy-tree' && (
              <LegacyTreeSurface
                stage={legacyPayload?.stage || legacyStage}
                score={legacyPayload?.score || lifeScore}
                memories={memories.length}
                connections={graph.links.length}
                years={timeline.length}
                people={topPeople.length}
                legacy={legacyPayload}
              />
            )}
            {surface === 'reports' && (
              <ReportsSurface
                weeklyReport={weeklyReport}
                memories={memories}
                topPeople={topPeople}
                topPlaces={topPlaces}
                storyEvents={storyEvents}
                timeline={timeline}
                messageCards={messageCards}
                copyWeeklyReport={copyWeeklyReport}
                emailWeeklyReport={emailWeeklyReport}
                exportArchive={exportArchive}
                reports={weeklyReports}
                recipients={reportRecipients}
                createReport={createWeeklyReportDraft}
                shareReport={shareWeeklyReport}
                createRecipient={createReportRecipient}
                sendReport={sendReportDraft}
              />
            )}
            {surface === 'care' && <CareSurface memories={memories} topPeople={topPeople} timeline={timeline} care={carePayload} />}
            {surface === 'memory-proof' && <MemoryProofSurface proofs={memoryProofs} memories={memories} askArchive={askArchive} />}
            {surface === 'life-chapters' && (
              <LifeChaptersSurface
                people={peopleProfiles}
                person={lifeChapterPerson || primaryPerson}
                setPerson={setLifeChapterPerson}
                chapters={lifeChapters}
                buildChapters={buildLifeChapters}
                exportBiography={exportBiography}
                busyAction={busyAction}
              />
            )}
            {surface === 'family-rituals' && (
              <FamilyRitualsSurface
                rituals={familyRituals}
                createRitual={createFamilyRitual}
                respondToRitual={respondToRitual}
                emailRitual={emailRitual}
                askArchive={askArchive}
                topPeople={topPeople}
                userEmail={user?.email}
              />
            )}
            {surface === 'memory-capsules' && <MemoryCapsulesSurface capsules={memoryCapsules} createCapsule={createMemoryCapsule} />}
            {surface === 'legacy-contacts' && <LegacyContactsSurface contacts={legacyContacts} createContact={createLegacyContact} />}
            {surface === 'trust' && (
              <>
                <TrustSurface
                  trust={trustPayload}
                  exportArchive={exportArchive}
                  exportAccountData={async () => {
                    const data = await apiJson<Record<string, unknown>>('/auth/export-data');
                    downloadTextFile('memorygraph-account-export.json', JSON.stringify(data, null, 2), 'application/json');
                    setNotice('GDPR account export downloaded.');
                  }}
                  deleteAccount={async (password: string) => {
                    await apiJson('/auth/account', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password }),
                    });
                    await logout();
                    router.replace('/');
                  }}
                />
                <InviteManager />
              </>
            )}
            {surface === 'one-life-story' && (
              <OneLifeStorySurface
                story={oneLifeStory}
                buildChapters={buildLifeChapters}
                askArchive={askArchive}
                exportBiography={exportBiography}
                shareStory={shareOneLifeStory}
              />
            )}
      </AppShell>
      {proofPreview && <MemorySourceDrawer proof={proofPreview} onClose={() => setProofPreview(null)} />}
    </main>
  );
}

function StoriesHubSurface({
  memoryCount,
  onSeed,
  busy,
}: {
  memoryCount: number;
  onSeed: () => void;
  busy: boolean;
}) {
  const cards = [
    {
      href: '/time-machine',
      title: 'Build a life chapter',
      body: 'Pick a person and time of life — we turn matching memories into a story you can read and play back.',
      cta: 'Create chapter',
    },
    {
      href: '/one-life-story',
      title: 'Share a life story',
      body: 'One beautiful link family can open — no account needed to read.',
      cta: 'Open story',
    },
    {
      href: '/memory-capsules',
      title: 'Letters for later',
      body: 'Write a message to open on a future date — a gentle way to stay present across time.',
      cta: 'Write a letter',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">Turn memories into stories</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {memoryCount > 0
            ? 'Your collection is ready. Start with a life chapter, share a story link, or schedule a letter.'
            : 'Load the sample family first so Stories has people and moments to work with.'}
        </p>
        {memoryCount === 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={onSeed}
            className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
          >
            {SEED_BUTTON}
          </button>
        )}
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.href} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">{card.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{card.body}</p>
            <Link
              href={card.href}
              className="mt-4 w-fit rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
            >
              {card.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudioSurface({
  memories,
  graph,
  memoryProofs,
  graphSelectedNode,
  setGraphSelectedNode,
  timeline,
  topPeople,
  topPlaces,
  storyEvents,
  uploadFile,
  setUploadFile,
  uploadMemory,
  seedArchive,
  busyAction,
  studioMode,
  activeJourneyIndex,
  uploadError,
  askArchive,
  runTimeMachine,
  legacyStage,
  exportArchive,
  createFamilyInvite,
  inviteLink,
  archiveMemory,
  deleteMemory,
}: {
  memories: MemoryItem[];
  graph: GraphResponse;
  memoryProofs: MemoryProofItem[];
  graphSelectedNode: string | null;
  setGraphSelectedNode: (id: string | null) => void;
  timeline: TimelineYear[];
  topPeople: Array<[string, number]>;
  topPlaces: GraphNode[];
  storyEvents: GraphNode[];
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  uploadMemory: () => void;
  seedArchive: () => void;
  busyAction: string | null;
  studioMode: StudioMode;
  activeJourneyIndex: number;
  uploadError?: string | null;
  askArchive: (question?: string) => Promise<void>;
  runTimeMachine: (query?: string) => Promise<void>;
  legacyStage: string;
  exportArchive: (format: 'json' | 'csv' | 'html') => Promise<void>;
  createFamilyInvite: () => Promise<void>;
  inviteLink: string | null;
  archiveMemory: (memoryId: string) => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;
}) {
  const primaryPerson = topPeople[0]?.[0] || 'Father';
  const secondaryPerson = topPeople[1]?.[0] || 'Grandfather';
  const primaryPlace = topPlaces[0]?.label || 'Mumbai';
  const recentMemories = memories.slice(0, 4);
  const archiveScore = Math.min(100, memories.length * 3 + timeline.length * 6 + topPeople.length * 5 + topPlaces.length * 4);
  const nextActions = [
    {
      title: 'Ask about grandfather',
      body: 'See answers with the exact memories they came from.',
      action: () => askArchive(`What do we know about ${secondaryPerson}?`),
    },
    {
      title: "Create father's twenties chapter",
      body: 'Turn a person and time of life into a story you can read and share.',
      action: () => runTimeMachine("Show my father's life between age 20-30"),
    },
    {
      title: 'Share your collection',
      body: 'Export a snapshot of your memories for family.',
      action: () => exportArchive('html'),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
        <Image
          src={familyImages[0].src}
          alt={familyImages[0].alt}
          fill
          priority
          sizes={HERO_PANEL_IMAGE_SIZES}
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-200">Home</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-bold tracking-normal">
              {memories.length ? 'Your family story is taking shape.' : 'Welcome — let’s bring your memories together.'}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {memories.length
                ? `${primaryPerson}, ${secondaryPerson}, and ${primaryPlace} are the strongest threads so far. Ask a question or build a chapter next.`
                : 'Add photos and notes, or try our sample family to see how Ask and Stories work.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void seedArchive()}
                disabled={!!busyAction}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100 disabled:bg-slate-300"
              >
                {SEED_BUTTON}
              </button>
              <Link
                href="/ask"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
              >
                Go to Ask
              </Link>
              <Link
                href="/stories"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
              >
                Build a chapter
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-200">Collection strength</p>
                <p className="mt-2 text-5xl font-bold">{archiveScore}</p>
              </div>
              <p className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-950">{memories.length > 5 ? 'Growing' : 'Starting'}</p>
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-yellow-300" style={{ width: `${Math.max(8, archiveScore)}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                ['People', topPeople.length],
                ['Places', topPlaces.length],
                ['Years', timeline.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/10 p-3">
                  <p className="text-xl font-bold">{value}</p>
                  <p className="mt-1 text-xs text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-200">{GRAPH_TITLE}</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">See how your family connects</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {graph.nodes.length > 0 ? GRAPH_NODES_HINT(graph.nodes.length, graph.links.length) : GRAPH_BODY}
            </p>
          </div>
          <Link href="/family" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-100">
            Open family map
          </Link>
        </div>
        <div className="relative mt-5 min-h-[min(62vh,760px)] overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-3 sm:p-4">
          {graph.nodes.length > 0 ? (
            <FamilyGraphD3
              nodes={graph.nodes}
              links={graph.links}
              proofs={memoryProofs}
              selectedId={graphSelectedNode}
              onSelect={setGraphSelectedNode}
              onAskAbout={(name) => void askArchive(`What do we know about ${name}?`)}
            />
          ) : (
            <div className="flex h-full min-h-[min(62vh,760px)] flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-base font-semibold text-white">{GRAPH_EMPTY}</p>
              <button
                type="button"
                onClick={() => void seedArchive()}
                disabled={!!busyAction}
                className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-400 disabled:bg-slate-600"
              >
                {SEED_BUTTON}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {nextActions.map((item) => (
          <button key={item.title} onClick={() => void item.action()} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
            <p className="text-xs font-semibold text-amber-800">Suggested next</p>
            <h3 className="mt-2 text-lg font-bold text-slate-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            <p className="mt-4 text-sm font-semibold text-slate-950 group-hover:text-cyan-700">Continue</p>
          </button>
        ))}
      </section>

      <section id="upload-zone" className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold text-amber-800">Add memories</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Upload or try the sample family</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Upload files or try the sample family. MemoryGraph finds people, places, and moments automatically.
          </p>
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Add my memories</span>
                <span className="mt-1 block text-sm text-slate-500">Photos, PDFs, journals, notes, chat exports, audio, or video.</span>
                <input
                  type="file"
                  accept=".txt,.md,.csv,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  className="mt-3 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
              <button
                onClick={uploadMemory}
                disabled={!uploadFile || !!busyAction}
                className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
              >
                Add memory
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void seedArchive()}
              disabled={!!busyAction}
              className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:bg-slate-300"
            >
              {SEED_BUTTON}
            </button>
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => (prompt.toLowerCase().includes('father') ? runTimeMachine(prompt) : askArchive(prompt))}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
              >
                {prompt}
              </button>
            ))}
            <button
              onClick={() => void exportArchive('html')}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
            >
              Export family report
            </button>
          </div>
          <div className="mt-5">
            <ProcessingJourney activeIndex={activeJourneyIndex} mode={studioMode} error={uploadError} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-52">
            <Image src={familyImages[4].src} alt={familyImages[4].alt} fill sizes={CARD_IMAGE_SIZES} className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-sm font-semibold text-amber-200">Your collection</p>
              <h3 className="mt-1 text-3xl font-bold">{memories.length} memories</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            {[
              ['Memories', memories.length],
              ['Years', timeline.length],
              ['People', topPeople.length],
              ['Moments', storyEvents.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-3xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-950">Share with family</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Invite someone to view and add to your shared collection.</p>
            <div className="mt-4 rounded-xl bg-amber-50 p-3">
              <button type="button" onClick={() => void createFamilyInvite()} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-amber-100">
                Copy invite link
              </button>
              {inviteLink && <p className="mt-2 break-all text-xs text-slate-500">{inviteLink}</p>}
            </div>
          </div>
        </div>
      </section>

      {recentMemories.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-950">Recent memories</h2>
            <Link href="/ask" className="text-sm font-semibold text-amber-800 hover:text-amber-900">
              Ask about them →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentMemories.map((memory) => (
              <MemoryCard
                key={memory.memory_id}
                memory={memory}
                compact
                onArchive={(memoryId) => void archiveMemory(memoryId)}
                onDelete={(memoryId) => void deleteMemory(memoryId)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AskSurface({
  question,
  setQuestion,
  askArchive,
  exportProofReport,
  runTimeMachine,
  busyAction,
  assistantResponse,
  assistantSources,
  assistantPeople,
  assistantPlaces,
  streamingAnswer,
  onProofClick,
}: {
  question: string;
  setQuestion: (value: string) => void;
  askArchive: (question?: string) => Promise<void>;
  exportProofReport: (format?: 'html' | 'pdf') => Promise<void>;
  runTimeMachine: (query?: string) => Promise<void>;
  busyAction: string | null;
  assistantResponse: ChatResponse | null;
  assistantSources: SearchResult[];
  assistantPeople: string[];
  assistantPlaces: string[];
  streamingAnswer?: string;
  onProofClick?: (proof: MemoryProofItem) => void;
}) {
  const startVoiceQuestion = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setQuestion(transcript);
    };
    recognition.start();
  };

  const displayAnswer = streamingAnswer || assistantResponse?.answer;

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-amber-800">Ask</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">{ASK_TITLE}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{ASK_BODY}</p>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={5}
          className="mt-5 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          placeholder={ASK_PLACEHOLDER}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void askArchive()}
            disabled={!!busyAction}
            className="flex-1 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
          >
            {ASK_SUBMIT}
          </button>
          <button
            type="button"
            onClick={startVoiceQuestion}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            aria-label="Ask with voice"
          >
            🎤
          </button>
        </div>
        <div className="mt-5 grid gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => (prompt.toLowerCase().includes('father') ? void runTimeMachine(prompt) : void askArchive(prompt))}
              className="rounded-xl bg-slate-50 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-900"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
          <p className="text-sm font-semibold text-amber-800">Answer</p>
          {(assistantResponse?.proofs?.length ?? 0) > 0 && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              Grounded in {assistantResponse?.proofs?.length} source memories from your archive
            </p>
          )}
          {busyAction === ASK_BUSY ? (
            <div className="mt-5 space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
          ) : displayAnswer ? (
            <>
              <div className="mt-4 rounded-lg bg-slate-950 p-5 text-sm leading-7 text-slate-100">{displayAnswer}</div>
              {(assistantResponse?.proofs?.length ?? 0) > 0 && (
                <div className="mt-5">
                  <MemoryProofList
                    proofs={assistantResponse!.proofs!}
                    title={SOURCES_TITLE}
                    onProofClick={onProofClick}
                  />
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/family" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900">
                  Family map
                </Link>
                <Link href="/stories" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900">
                  Stories
                </Link>
                <button
                  onClick={() => void runTimeMachine(`Build a life chapter from: ${question}`)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  Turn into chapter
                </button>
                {(assistantResponse?.proofs?.length ?? 0) > 0 && (
                  <>
                    <button
                      onClick={() => void exportProofReport('html')}
                      className="rounded-full bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-900 hover:bg-cyan-200"
                    >
                      Export sources (HTML)
                    </button>
                    <button
                      onClick={() => void exportProofReport('pdf')}
                      className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200"
                    >
                      Export sources (PDF)
                    </button>
                  </>
                )}
                {assistantPeople.map((person) => (
                  <button
                    key={person}
                    onClick={() => void askArchive(`Tell me more about ${person}`)}
                    className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Follow up on {person}
                  </button>
                ))}
                {assistantPlaces.map((place) => (
                  <button
                    key={place}
                    onClick={() => void askArchive(`What memories connect to ${place}?`)}
                    className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    Explore {place}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">
              Ask about a person, place, or time — your answer and sources will appear here.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Source memories</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {assistantSources.length === 0 ? (
              <p className="md:col-span-2 text-sm text-slate-500">Sources appear after you ask a question.</p>
            ) : (
              assistantSources.slice(0, 6).map((memory) => <MemoryCard key={memory.memory_id} memory={memory} compact />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryCompanionSurface({
  sessions,
  activeSession,
  messages,
  answer,
  setAnswer,
  startSession,
  sendAnswer,
  saveSession,
  busyAction,
}: {
  sessions: StorySessionSummary[];
  activeSession: StorySessionSummary | null;
  messages: StoryMessage[];
  answer: string;
  setAnswer: (value: string) => void;
  startSession: (mode: string) => Promise<void>;
  sendAnswer: () => Promise<void>;
  saveSession: () => Promise<void>;
  busyAction: string | null;
}) {
  const modes = ['Childhood', 'Family', 'Places', 'Career', 'Love', 'Loss', 'Advice', 'Legacy'];
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'unsupported'>('idle');
  const speakLatestQuestion = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const latest = [...messages].reverse().find((message) => message.role === 'assistant')?.content || activeSession?.next_question;
    if (!latest) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(latest));
  };
  const startVoiceCapture = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceState('unsupported');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceState('listening');
    recognition.onerror = () => setVoiceState('idle');
    recognition.onend = () => setVoiceState('idle');
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setAnswer(`${answer}${answer ? ' ' : ''}${transcript}`);
    };
    recognition.start();
  };
  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Guided story companion</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Capture a lifetime through warm conversation.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Pick a chapter. MemoryGraph asks follow-up questions, extracts people and places, and can save the conversation as a real connected memory.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {modes.map((mode) => (
              <button key={mode} onClick={() => void startSession(mode)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50">
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Recent sessions</h3>
          <div className="mt-4 space-y-2">
            {sessions.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Start a guided session to preserve a story.</p>
            ) : (
              sessions.slice(0, 6).map((session) => (
                <div key={session.session_id} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-950">{session.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{session.mode} · {session.message_count} messages · {session.status}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="relative h-44">
          <Image src={familyImages[1].src} alt={familyImages[1].alt} fill sizes="(min-width: 1280px) 45vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">{activeSession?.mode || 'Choose a chapter'}</p>
            <h3 className="mt-1 text-2xl font-bold">{activeSession?.title || 'A gentle interview will begin here'}</h3>
          </div>
        </div>
        <div className="max-h-[420px] space-y-3 overflow-auto p-5">
          {(messages.length ? messages : [{ role: 'assistant', content: 'Choose a story mode to begin. I will ask one warm question at a time.' }]).map((message, index) => (
            <div key={`${message.role}-${index}`} className={`rounded-lg p-4 text-sm leading-6 ${message.role === 'assistant' ? 'bg-cyan-50 text-slate-700' : 'bg-slate-950 text-white'}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{message.role === 'assistant' ? 'MemoryGraph' : 'You'}</p>
              <p className="mt-1">{message.content}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-5">
          <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm" placeholder="Answer with a real memory, detail, person, place, or lesson..." />
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={() => void sendAnswer()} disabled={!activeSession || !answer.trim() || !!busyAction} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300">
              Send answer
            </button>
            <button onClick={startVoiceCapture} disabled={!activeSession} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-cyan-50 disabled:text-slate-300">
              {voiceState === 'listening' ? 'Listening...' : 'Speak answer'}
            </button>
            <button onClick={speakLatestQuestion} disabled={!activeSession} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-cyan-50 disabled:text-slate-300">
              Read question aloud
            </button>
            <button onClick={() => void saveSession()} disabled={!activeSession || !!busyAction} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-cyan-50 disabled:text-slate-300">
              Save as memory
            </button>
          </div>
          {voiceState === 'unsupported' && <p className="mt-2 text-xs font-semibold text-amber-700">Voice capture is not supported in this browser, but typed story capture still works.</p>}
        </div>
      </div>
    </section>
  );
}

function PresenceSurface({
  people,
  person,
  setPerson,
  question,
  setQuestion,
  response,
  askPresence,
  busyAction,
}: {
  people: PersonProfileSummary[];
  person: string;
  setPerson: (value: string) => void;
  question: string;
  setQuestion: (value: string) => void;
  response: PresencePayload | null;
  askPresence: (person?: string, mode?: string) => Promise<void>;
  busyAction: string | null;
}) {
  const selectedProfile = people.find((profile) => profile.name === person) || people[0];
  const modes = ['Storytelling', 'Advice', 'Q&A', 'Reminiscing'];
  return (
    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">Digital presence</p>
        <h2 className="mt-2 text-4xl font-bold">Talk with a source-grounded memory profile.</h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          This is built from real memories, values, places, and source cards. It is not pretending to be a person; it is a warm interface to their preserved story.
        </p>
        <input
          value={person}
          onChange={(event) => setPerson(event.target.value)}
          list="presence-people"
          className="mt-5 w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400"
          placeholder="Choose a person"
        />
        <datalist id="presence-people">
          {people.map((profile) => <option key={profile.id} value={profile.name} />)}
        </datalist>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={5}
          className="mt-3 w-full resize-none rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400"
          placeholder="Ask for a story, advice, or a memory..."
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {modes.map((mode) => (
            <button key={mode} onClick={() => void askPresence(person, mode)} disabled={!!busyAction} className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100 disabled:bg-slate-300">
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Presence profile</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-950">{response?.person || selectedProfile?.name || person}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{selectedProfile?.biography || 'Choose a discovered person to reconstruct their story from source memories.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(response?.memory_dna.core_values || ['Family', 'Memory', 'Legacy']).map((value) => (
              <span key={value} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">{value}</span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">{response ? `${response.mode} answer` : 'Answer appears here'}</h3>
          <p className="mt-4 rounded-lg bg-slate-950 p-5 text-sm leading-7 text-white">
            {busyAction === 'Reconstructing presence' ? 'Reconstructing from source memories...' : response?.answer || 'Ask a question to generate a grounded response with source memory cards.'}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(response?.sources || []).slice(0, 4).map((source) => <MemoryCard key={source.memory_id} memory={source} compact />)}
        </div>
      </div>
    </section>
  );
}

function PeopleSurface({
  people,
  askArchive,
  portrait,
  loadPortrait,
  busyAction,
}: {
  people: PersonProfileSummary[];
  askArchive: (question?: string) => Promise<void>;
  portrait: { person: string; portrait: string; proofs?: MemoryProofItem[] } | null;
  loadPortrait: (name: string) => Promise<void>;
  busyAction: string | null;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-amber-800">Family members</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">People discovered from your memories</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Each profile is built from real memories — tap to ask questions or open a full profile.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {people.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
            {SEED_BUTTON} on Home to discover people automatically.
          </p>
        ) : (
          people.map((person) => (
            <div key={person.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{person.role || 'Family member'}</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-950">{person.name}</h3>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">{person.memory_count} memories</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">{person.biography || 'We are still learning about this person from your files.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...person.places.slice(0, 3), ...person.years.slice(0, 2)].map((chip) => (
                  <span key={chip} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{chip}</span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/people/${encodeURIComponent(person.name)}`} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                  View profile
                </Link>
                <button type="button" onClick={() => void askArchive(`What do we know about ${person.name}?`)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50">
                  Ask
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {portrait && (
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-amber-800">Story about {portrait.person}</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">{portrait.portrait}</p>
          {portrait.proofs && portrait.proofs.length > 0 && (
            <div className="mt-4">
              <MemoryProofList proofs={portrait.proofs} title="Sources" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function FamilyTreeSurface({
  topPeople,
  peopleProfiles,
  relationships,
  graph,
  memories,
  memoryProofs,
  graphSelectedNode,
  setGraphSelectedNode,
  askArchive,
  runTimeMachine,
  primaryPerson,
  secondaryPerson,
  exportArchive,
  createRelationship,
  deleteRelationship,
  updatePersonProfile,
  shareFamilyTree,
}: {
  topPeople: Array<[string, number]>;
  peopleProfiles: PersonProfileSummary[];
  relationships: FamilyRelationshipItem[];
  graph: GraphResponse;
  memories: MemoryItem[];
  memoryProofs: MemoryProofItem[];
  graphSelectedNode: string | null;
  setGraphSelectedNode: (id: string | null) => void;
  askArchive: (question?: string) => Promise<void>;
  runTimeMachine: (query?: string) => Promise<void>;
  primaryPerson: string;
  secondaryPerson: string;
  exportArchive: (format: 'json' | 'csv' | 'html') => Promise<void>;
  createRelationship: (payload: { person_a: string; relation: string; person_b: string; notes?: string }) => Promise<void>;
  deleteRelationship: (relationshipId: string) => Promise<void>;
  updatePersonProfile: (person: string, payload: { role?: string; biography?: string; photo_url?: string; birth_year?: string; notes?: string }) => Promise<void>;
  shareFamilyTree: () => Promise<void>;
}) {
  const people: Array<[string, number]> = peopleProfiles.length
    ? peopleProfiles.map((person) => [person.name, person.memory_count])
    : topPeople.length
      ? topPeople
      : [[primaryPerson, 5], [secondaryPerson, 4], ['Mother', 3], ['Family', 3]];
  const [selectedPerson, setSelectedPerson] = useState(people[0]?.[0] || primaryPerson);
  const [personA, setPersonA] = useState(people[0]?.[0] || primaryPerson);
  const [relation, setRelation] = useState('father');
  const [personB, setPersonB] = useState(people[1]?.[0] || secondaryPerson);
  const [profileRole, setProfileRole] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profileBirthYear, setProfileBirthYear] = useState('');
  const [profileNotes, setProfileNotes] = useState('');
  const selectedCount = people.find(([person]) => person === selectedPerson)?.[1] || 0;
  const selectedProfile = peopleProfiles.find((person) => person.name === selectedPerson);
  const relatedMemories = memories
    .filter((memory) => `${memory.title} ${memory.summary}`.toLowerCase().includes(selectedPerson.toLowerCase()))
    .slice(0, 4);

  return (
    <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-amber-200">Family map</p>
        <h2 className="mt-2 text-2xl font-bold">People and connections from your memories</h2>
        <div className="relative mt-6 min-h-[min(58vh,680px)] overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-4">
          {graph.nodes.length > 0 ? (
            <FamilyGraphD3
              nodes={graph.nodes}
              links={graph.links}
              proofs={memoryProofs}
              selectedId={graphSelectedNode}
              onSelect={(id) => {
                setGraphSelectedNode(id);
                setSelectedPerson(id);
              }}
              onAskAbout={(name) => void askArchive(`What do we know about ${name}?`)}
            />
          ) : (
            <p className="flex h-full min-h-[320px] items-center justify-center p-8 text-center text-sm text-slate-400">
              Load the sample family on Home to see your map.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-800">Selected</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-950">{selectedPerson}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {selectedProfile?.biography || `${selectedCount} memories mention this person.`}
          </p>
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={() => void askArchive(`What do we know about ${selectedPerson}?`)} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Ask about {selectedPerson}
            </button>
            <Link href="/stories" className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-amber-50">
              Build a life chapter
            </Link>
          </div>
          {relatedMemories.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold text-slate-500">Related memories</p>
              {relatedMemories.map((memory) => (
                <p key={memory.memory_id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">{memory.title}</span>
                  {memory.summary ? ` — ${memory.summary.slice(0, 80)}…` : null}
                </p>
              ))}
            </div>
          )}
        </div>
        <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-bold text-slate-950">Edit profile & relationships</summary>
          <div className="mt-4 grid gap-3">
            <input value={profileRole} onChange={(event) => setProfileRole(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder={selectedProfile?.role || 'Role, e.g. Father'} />
            <input value={profileBirthYear} onChange={(event) => setProfileBirthYear(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Birth year" />
            <textarea value={profileNotes} onChange={(event) => setProfileNotes(event.target.value)} rows={3} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Notes or biography" />
            <button type="button" onClick={() => void updatePersonProfile(selectedPerson, { role: profileRole, biography: profileNotes, photo_url: profilePhoto, birth_year: profileBirthYear, notes: profileNotes })} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Save profile
            </button>
          </div>
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5">
            <input value={personA} onChange={(event) => setPersonA(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Person A" />
            <select value={relation} onChange={(event) => setRelation(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              {['father', 'mother', 'spouse', 'sibling', 'child', 'grandparent', 'friend'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input value={personB} onChange={(event) => setPersonB(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Person B" />
            <button type="button" onClick={() => void createRelationship({ person_a: personA, relation, person_b: personB })} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Add relationship
            </button>
          </div>
        </details>
      </div>
    </section>
  );
}

function LifeMapSurface({
  topPeople,
  topPlaces,
  storyEvents,
  timeline,
  graph,
  askArchive,
  exportArchive,
  saveLifeMapSnapshot,
  snapshots,
}: {
  topPeople: Array<[string, number]>;
  topPlaces: GraphNode[];
  storyEvents: GraphNode[];
  timeline: TimelineYear[];
  graph: GraphResponse;
  askArchive: (question?: string) => Promise<void>;
  exportArchive: (format: 'json' | 'csv' | 'html') => Promise<void>;
  saveLifeMapSnapshot: (person?: string) => Promise<void>;
  snapshots: LifeMapSnapshotItem[];
}) {
  const categories = [
    { label: 'Family', values: topPeople.map(([person]) => person), color: 'emerald' },
    { label: 'Places', values: topPlaces.map((place) => place.label), color: 'amber' },
    { label: 'Milestones', values: storyEvents.map((event) => event.label), color: 'pink' },
    { label: 'Years', values: timeline.map((item) => String(item.year)), color: 'violet' },
    { label: 'Memories', values: graph.nodes.filter((node) => node.group === 'memory').slice(0, 8).map((node) => node.label), color: 'cyan' },
  ];
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  return (
    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Visual life map</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-2xl font-bold text-slate-950">One archive, many life dimensions</h2>
          <button
            onClick={() => void exportArchive('json')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
          >
            Export map data
          </button>
          <button
            onClick={() => void saveLifeMapSnapshot(topPeople[0]?.[0])}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save snapshot
          </button>
        </div>
        <div className="relative mt-6 min-h-[560px] overflow-hidden rounded-lg bg-slate-950 p-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.18),_transparent_42%)]" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-60">
            {categories.map((category, index) => {
              const angle = (index / categories.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 34;
              const y = 50 + Math.sin(angle) * 36;
              return <line key={category.label} x1="50" y1="50" x2={x} y2={y} stroke={selectedCategory.label === category.label ? '#facc15' : '#22d3ee'} strokeWidth={selectedCategory.label === category.label ? '0.5' : '0.22'} />;
            })}
          </svg>
          <div className="relative mx-auto flex h-[min(58vh,640px)] w-full max-w-none items-center justify-center">
            <div className="absolute z-10 rounded-full border border-cyan-300/40 bg-white/10 px-8 py-6 text-center backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Life center</p>
              <h3 className="mt-1 text-2xl font-bold">Family Archive</h3>
            </div>
            {categories.map((category, index) => {
              const angle = (index / categories.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 34;
              const y = 50 + Math.sin(angle) * 36;
              return (
                <button
                  key={category.label}
                  onClick={() => setSelectedCategory(category)}
                  className={`absolute w-44 rounded-lg border p-4 text-left backdrop-blur transition hover:-translate-y-0.5 ${
                    selectedCategory.label === category.label ? 'border-yellow-300 bg-yellow-300/15 shadow-2xl shadow-yellow-500/10' : 'border-white/10 bg-white/10 hover:bg-white/15'
                  }`}
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <p className="font-bold">{category.label}</p>
                  <p className="mt-1 text-xs text-slate-300">{category.values.length || 3} signals</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(category.values.length ? category.values : ['Waiting', 'For', 'Archive']).slice(0, 3).map((value) => (
                      <span key={value} className="rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-slate-100">
                        {value}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Selected dimension</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-950">{selectedCategory.label}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            MemoryGraph found {selectedCategory.values.length || 0} signals in this category. Use this as a narrative lens during the demo.
          </p>
          <button
            onClick={() => void askArchive(`Tell me about ${selectedCategory.label.toLowerCase()} in this archive`)}
            className="mt-4 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Ask about {selectedCategory.label.toLowerCase()}
          </button>
        </div>
        {categories.map((category) => (
          <div key={category.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-950">{category.label}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(category.values.length ? category.values : ['Sample archive will fill this']).slice(0, 8).map((value) => (
                <span key={value} className="rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                  {value}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Saved life maps</h3>
          <div className="mt-4 space-y-2">
            {snapshots.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Save a snapshot to preserve this life map reconstruction.</p>
            ) : (
              snapshots.slice(0, 4).map((snapshot) => (
                <div key={snapshot.snapshot_id} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-950">{snapshot.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{snapshot.person || 'Family'} · {formatDate(snapshot.created_at)}</p>
                  <p className="mt-2 text-sm text-slate-600">{snapshot.categories.reduce((total, category) => total + category.count, 0)} mapped memory nodes</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const TIME_MACHINE_EMPTY_NARRATIVE =
  'I could not find enough connected memories for that Time Machine view yet';

function TimeMachineSurface({
  timeQuery,
  setTimeQuery,
  birthYear,
  setBirthYear,
  runTimeMachine,
  busyAction,
  timeResponse,
  memoryCount,
  onLoadSample,
}: {
  timeQuery: string;
  setTimeQuery: (value: string) => void;
  birthYear: string;
  setBirthYear: (value: string) => void;
  runTimeMachine: (query?: string) => Promise<void>;
  busyAction: string | null;
  timeResponse: TimeMachineResponse | null;
  memoryCount: number;
  onLoadSample: () => void;
}) {
  const people = unique(timeResponse?.memories.flatMap((memory) => memory.structured_data?.people || []) || []).slice(0, 8);
  const places = unique(timeResponse?.memories.flatMap((memory) => memory.structured_data?.places || []) || []).slice(0, 8);
  const milestones = timeResponse?.timeline.slice(0, 10) || [];
  const chapterEmpty =
    !timeResponse?.memories?.length ||
    timeResponse.narrative.toLowerCase().includes(TIME_MACHINE_EMPTY_NARRATIVE.toLowerCase());
  const [playbackActive, setPlaybackActive] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const activeMilestone = milestones[playbackIndex];

  useEffect(() => {
    if (!playbackActive || milestones.length === 0) return;
    const id = window.setInterval(() => {
      setPlaybackIndex((value) => Math.min(value + 1, milestones.length - 1));
    }, 1400);
    return () => window.clearInterval(id);
  }, [milestones.length, playbackActive]);

  useEffect(() => {
    if (!playbackActive || milestones.length === 0 || playbackIndex < milestones.length - 1) return;
    const id = window.setTimeout(() => setPlaybackActive(false), 1400);
    return () => window.clearTimeout(id);
  }, [milestones.length, playbackActive, playbackIndex]);

  const exportChapter = () => {
    if (!timeResponse) return;
    const content = [
      'MemoryGraph Life Chapter',
      '',
      timeResponse.narrative,
      '',
      'Milestones',
      ...milestones.map((item) => `- ${item.year || item.date_text || 'Memory'}: ${item.label}`),
      '',
      `People: ${people.join(', ') || 'None detected'}`,
      `Places: ${places.join(', ') || 'None detected'}`,
    ].join('\n');
    downloadTextFile('memorygraph-time-machine-chapter.txt', content, 'text/plain');
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-800">{CHAPTER_TITLE}</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Turn a slice of life into a story</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{CHAPTER_BODY}</p>
          </div>
          <div className="space-y-3">
            <input
              value={timeQuery}
              onChange={(event) => setTimeQuery(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <input
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                placeholder={BIRTH_YEAR_LABEL}
                aria-label={BIRTH_YEAR_LABEL}
              />
              <button
                type="button"
                onClick={() => void runTimeMachine()}
                disabled={!!busyAction}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
              >
                {CHAPTER_BUILD}
              </button>
            </div>
          </div>
        </div>
      </div>
      {busyAction === CHAPTER_BUSY && <ProcessingJourney activeIndex={4} mode="sample" />}
      {timeResponse ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="relative min-h-[min(42vh,480px)] bg-slate-950 p-6 text-white sm:p-8">
              <Image
                src={familyImages[0].src}
                alt={familyImages[0].alt}
                fill
                priority
                sizes={HERO_PANEL_IMAGE_SIZES}
                className="object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-slate-950/45" />
              <div className="relative">
                <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">Reconstructed chapter</p>
                <h2 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl lg:text-5xl">
                  {timeResponse.resolved_person
                    ? `${timeResponse.resolved_person}'s life`
                    : timeQuery.toLowerCase().includes('father')
                      ? "Father's Life"
                      : 'Life Chapter'}
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-200 sm:text-lg">{timeResponse.narrative}</p>
                {chapterEmpty && (
                  <div className="mt-5 rounded-xl border border-amber-300/40 bg-amber-500/15 p-4 text-sm leading-7 text-amber-50">
                    {memoryCount === 0 ? (
                      <>
                        Your archive is empty. Load the sample Patel family, then build this chapter again with birth year{' '}
                        <strong>1978</strong>.
                      </>
                    ) : (
                      <>
                        We found {memoryCount} memories, but none matched this person and age range. Try birth year{' '}
                        <strong>1978</strong> for Father, or run the sample loader on Home.
                      </>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {memoryCount === 0 && (
                        <button
                          type="button"
                          onClick={onLoadSample}
                          disabled={!!busyAction}
                          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100 disabled:opacity-60"
                        >
                          Load sample family
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void runTimeMachine()}
                        disabled={!!busyAction}
                        className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setPlaybackIndex(0);
                      setPlaybackActive(true);
                    }}
                    disabled={milestones.length === 0}
                    className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-100 disabled:bg-slate-300"
                  >
                    Play story
                  </button>
                  <button onClick={() => setPlaybackActive(false)} className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15">
                    Pause
                  </button>
                  <button
                    onClick={exportChapter}
                    disabled={chapterEmpty}
                    className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
                  >
                    Export chapter
                  </button>
                </div>
              </div>
            </div>
            {activeMilestone && (
              <div className="border-b border-cyan-200 bg-cyan-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  Now revealing {playbackIndex + 1} of {milestones.length}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{activeMilestone.year || activeMilestone.date_text || 'Memory'}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{activeMilestone.label}</p>
              </div>
            )}
            <div className="p-6">
            <div className="mt-6 space-y-4">
              {milestones.map((event, index) => (
                <div
                  key={`${event.memory_id}-${index}`}
                  className={`grid gap-4 rounded-lg border p-4 transition sm:grid-cols-[96px_1fr] ${
                    playbackIndex === index ? 'border-cyan-300 bg-cyan-50 shadow-md ring-4 ring-cyan-100' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-2xl font-bold text-cyan-700">{event.year || event.date_text || 'Memory'}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Milestone</p>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{event.label}</p>
                </div>
              ))}
            </div>
            </div>
          </div>
          <div className="space-y-5">
            {(timeResponse.proofs?.length ?? 0) > 0 && (
              <MemoryProofList proofs={timeResponse.proofs!} title="Memory Proof for this chapter" />
            )}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-950">Why this matters</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The answer is not a generic biography. It is a source-grounded reconstruction from memories, years, people, and places.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-950">People and places</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...people, ...places].map((item) => (
                  <span key={item} className="rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-950">Source memories</h3>
              <div className="mt-4 space-y-3">{timeResponse.memories.slice(0, 4).map((memory) => <MemoryCard key={memory.memory_id} memory={memory} compact />)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">No chapter yet</p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Load the <strong>sample family</strong> on Home if you have not yet, then try: father&apos;s life between age 20–30 with birth year{' '}
            <strong>1978</strong>.
          </p>
          <Link href="/studio" className="mt-4 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500">
            Go to Home
          </Link>
        </div>
      )}
    </section>
  );
}

function MessagesSurface({ messages, askArchive }: { messages: MemoryItem[]; askArchive: (question?: string) => Promise<void> }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Messages from the heart</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Beautiful moments surfaced from real memories.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          MemoryGraph detects warm, grateful, and relationship-rich moments so families can revisit what matters.
        </p>
        <button
          onClick={() => void askArchive('Which memories feel most heartfelt?')}
          className="mt-5 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Ask for heartfelt memories
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {messages.map((memory, index) => (
          <div key={memory.memory_id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="relative h-36">
              <Image src={familyImages[index % familyImages.length].src} alt={familyImages[index % familyImages.length].alt} fill sizes="(min-width: 768px) 35vw, 100vw" className="object-cover" />
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Heart moment</p>
              <h3 className="mt-2 text-lg font-bold text-slate-950">{memory.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{memory.summary}</p>
              <div className="mt-4 flex gap-2">
                {['Love', 'Grateful', 'Save'].map((reaction) => (
                  <button key={reaction} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-pink-50 hover:text-pink-700">
                    {reaction}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StoryboardsSurface({
  memories,
  topPeople,
  topPlaces,
  runTimeMachine,
  storybooks,
  createStorybook,
  shareStorybook,
  exportStorybook,
}: {
  memories: MemoryItem[];
  topPeople: Array<[string, number]>;
  topPlaces: GraphNode[];
  runTimeMachine: (query?: string) => Promise<void>;
  storybooks: StorybookItem[];
  createStorybook: (style: string, query?: string) => Promise<void>;
  shareStorybook: (storybookId: string) => Promise<void>;
  exportStorybook: (storybookId: string, title: string) => Promise<void>;
}) {
  const scenes = (memories.length ? memories.slice(0, 6) : [
    { memory_id: 'scene-1', title: 'Grandfather and Mumbai', summary: 'A place, a person, and a summer memory become the opening scene.', status: 'ready' },
    { memory_id: 'scene-2', title: "Father's early years", summary: 'Education, work, and family support become a clear life chapter.', status: 'ready' },
    { memory_id: 'scene-3', title: 'Family traditions', summary: 'Small repeated moments become a visual family ritual.', status: 'ready' },
  ]) as MemoryItem[];
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Illustrated storyboards</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Turn memories into shareable story scenes.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Generate persisted storybooks with chapters, source memories, visual prompts, and export-ready structure.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {['Heritage Gallery', 'Watercolor', 'Documentary', 'Vintage Photo', "Children's Book"].map((style) => (
            <button key={style} onClick={() => void createStorybook(style)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-cyan-50">
              Create {style}
            </button>
          ))}
        </div>
      </div>
      {storybooks.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {storybooks.slice(0, 4).map((book) => (
            <div key={book.storybook_id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">{book.style}</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">{book.title}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {book.chapters.slice(0, 4).map((chapter) => (
                  <div key={`${book.storybook_id}-${chapter.chapter}`} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scene {chapter.chapter}</p>
                    <p className="mt-1 font-semibold text-slate-950">{chapter.title}</p>
                    <p className="mt-1 line-clamp-3 text-sm text-slate-600">{chapter.summary}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => void shareStorybook(book.storybook_id)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                  Copy public storybook
                </button>
                <button onClick={() => void exportStorybook(book.storybook_id, book.title)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-cyan-50">
                  Export printable HTML
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {scenes.map((memory, index) => (
          <button
            key={memory.memory_id}
            onClick={() => void runTimeMachine(`Build a story chapter from ${memory.title}`)}
            className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
          >
            <div className="relative h-48">
              <Image src={familyImages[index % familyImages.length].src} alt={familyImages[index % familyImages.length].alt} fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">Scene {index + 1}</div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-950">{memory.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{memory.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(index % 2 === 0 ? topPeople.map(([person]) => person) : topPlaces.map((place) => place.label)).slice(0, 3).map((chip) => (
                  <span key={chip} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function LegacyTreeSurface({
  stage,
  score,
  memories,
  connections,
  years,
  people,
  legacy,
}: {
  stage: string;
  score: number;
  memories: number;
  connections: number;
  years: number;
  people: number;
  legacy: LegacyPayload | null;
}) {
  const badges = legacy?.badges.map((badge) => ({ label: badge.title, earned: badge.earned })) || [
    { label: 'First memory', earned: memories > 0 },
    { label: 'Family thread', earned: people >= 3 },
    { label: 'Ten years mapped', earned: years >= 10 },
    { label: 'Relationship web', earned: connections >= 50 },
    { label: 'Legacy chapter', earned: score >= 75 },
  ];
  const inputs = legacy?.inputs || { memories, connections, years, people };
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Legacy tree</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Watch the archive grow as the story deepens.</h2>
        <div className="relative mt-6 flex min-h-[560px] items-end justify-center overflow-hidden rounded-lg bg-gradient-to-b from-cyan-50 via-white to-emerald-100 p-8">
          <div className="absolute inset-x-0 bottom-0 h-28 bg-emerald-200/60" />
          <div className="relative h-[420px] w-[360px]">
            <div className="absolute bottom-0 left-1/2 h-64 w-12 -translate-x-1/2 rounded-t-full bg-gradient-to-b from-amber-700 to-amber-900" />
            <div className="absolute bottom-40 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-500/85 shadow-2xl" />
            <div className="absolute bottom-52 left-16 h-40 w-40 rounded-full bg-emerald-400/90 shadow-xl" />
            <div className="absolute bottom-52 right-16 h-40 w-40 rounded-full bg-teal-500/85 shadow-xl" />
            <div className="absolute bottom-72 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-lime-400/90 shadow-xl" />
          </div>
          <div className="absolute left-6 top-6 rounded-lg border border-emerald-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Current stage</p>
            <h3 className="mt-1 text-3xl font-bold text-slate-950">{stage}</h3>
            <p className="mt-2 text-sm text-slate-600">{score}/100 legacy growth</p>
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Growth inputs</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Object.entries(inputs).slice(0, 6).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-3xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-sm capitalize text-slate-500">{label.replaceAll('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Next best action</h3>
          <p className="mt-3 rounded-lg bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">{legacy?.next_action || 'Add one more meaningful memory to grow the archive.'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Legacy badges</h3>
          <div className="mt-4 space-y-2">
            {badges.map((badge) => (
              <div key={badge.label} className={`rounded-lg px-3 py-2 text-sm font-semibold ${badge.earned ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                {badge.earned ? 'Unlocked: ' : 'Locked: '}
                {badge.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportsSurface({
  weeklyReport,
  memories,
  topPeople,
  topPlaces,
  storyEvents,
  timeline,
  messageCards,
  copyWeeklyReport,
  emailWeeklyReport,
  exportArchive,
  reports,
  recipients,
  createReport,
  shareReport,
  createRecipient,
  sendReport,
}: {
  weeklyReport: string;
  memories: MemoryItem[];
  topPeople: Array<[string, number]>;
  topPlaces: GraphNode[];
  storyEvents: GraphNode[];
  timeline: TimelineYear[];
  messageCards: MemoryItem[];
  copyWeeklyReport: () => Promise<void>;
  emailWeeklyReport: () => void;
  exportArchive: (format: 'json' | 'csv' | 'html') => Promise<void>;
  reports: WeeklyReportDraft[];
  recipients: ReportRecipientItem[];
  createReport: (recipientType: string) => Promise<void>;
  shareReport: (reportId: string) => Promise<void>;
  createRecipient: (payload: { name: string; email: string; relationship?: string; cadence?: string }) => Promise<void>;
  sendReport: (reportId: string) => Promise<void>;
}) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientRelationship, setRecipientRelationship] = useState('');
  return (
    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Weekly family update</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">A warm letter from the archive.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Generate a family-ready update with new memory signals, people, places, heartfelt moments, and suggested questions.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button onClick={() => void copyWeeklyReport()} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Copy letter
            </button>
            <button onClick={emailWeeklyReport} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-cyan-50">
              Open email draft
            </button>
            <button onClick={() => void exportArchive('html')} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-cyan-50">
              Download report
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Parent', 'Sibling', 'Grandchild', 'Family Group'].map((recipient) => (
              <button key={recipient} onClick={() => void createReport(recipient)} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-100">
                Generate for {recipient}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-950">Personalize for</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Mom', 'Sibling', 'Family group', 'Grandchildren'].map((recipient) => (
                <span key={recipient} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                  {recipient}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Update signals</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['Memories', memories.length],
              ['People', topPeople.length],
              ['Places', topPlaces.length],
              ['Years', timeline.length],
              ['Story signals', storyEvents.length],
              ['Heart moments', messageCards.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">What changed this week</h3>
          <div className="mt-4 space-y-2">
            {[
              `${topPeople[0]?.[0] || 'A family member'} became a stronger relationship anchor.`,
              `${topPlaces[0]?.label || 'A meaningful place'} appeared as a story location.`,
              `${messageCards[0]?.title || 'A heartfelt moment'} is ready to share.`,
            ].map((item) => (
              <div key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Report recipients</h3>
          <div className="mt-4 grid gap-3">
            <input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Name" />
            <input value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Email" />
            <input value={recipientRelationship} onChange={(event) => setRecipientRelationship(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Relationship" />
            <button
              onClick={() => void createRecipient({ name: recipientName, email: recipientEmail, relationship: recipientRelationship, cadence: 'weekly' })}
              className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Save recipient
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {recipients.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Add recipients to draft weekly delivery logs.</p>
            ) : (
              recipients.slice(0, 4).map((recipient) => (
                <div key={recipient.recipient_id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <strong>{recipient.name}</strong> · {recipient.email}
                  <span className="block text-xs text-slate-500">{recipient.relationship || 'Family'} · {recipient.cadence}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-950">Saved report drafts</h3>
          <div className="mt-4 space-y-3">
            {reports.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Generate a weekly letter to save a draft.</p>
            ) : (
              reports.slice(0, 4).map((report) => (
                <div key={report.report_id} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-950">{report.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{report.recipient_type} · {formatDate(report.created_at)}</p>
                  <button onClick={() => void shareReport(report.report_id)} className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-cyan-50">
                    Copy public link
                  </button>
                  <button onClick={() => void sendReport(report.report_id)} className="ml-2 mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-cyan-50">
                    Draft delivery
                  </button>
                  {report.share_token && <p className="mt-2 text-xs text-cyan-700">Shared: /public/reports/{report.share_token}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="relative h-44">
          <Image src={familyImages[4].src} alt={familyImages[4].alt} fill sizes="(min-width: 1280px) 45vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">Preview</p>
            <h3 className="mt-1 text-2xl font-bold">This Week in Your Family Archive</h3>
          </div>
        </div>
        <pre className="max-h-[560px] whitespace-pre-wrap p-6 text-sm leading-7 text-slate-700">{weeklyReport}</pre>
      </div>
    </section>
  );
}

function CareSurface({ memories, topPeople, timeline, care }: { memories: MemoryItem[]; topPeople: Array<[string, number]>; timeline: TimelineYear[]; care: CarePayload | null }) {
  const text = memories.map((memory) => `${memory.title} ${memory.summary}`).join(' ').toLowerCase();
  const loneliness = /alone|lonely|miss|distance|isolated/.test(text);
  const gratitude = /grateful|love|proud|thank|family/.test(text);
  const careSignals = care?.signals || [
    { label: 'Connection rhythm', value: topPeople.length >= 4 ? 'Healthy variety' : 'Needs more family context', tone: topPeople.length >= 4 ? 'good' : 'watch' },
    { label: 'Emotional warmth', value: gratitude ? 'Warm moments detected' : 'Still learning tone', tone: gratitude ? 'good' : 'neutral' },
    { label: 'Isolation language', value: loneliness ? 'Check-in suggested' : 'No strong concern detected', tone: loneliness ? 'watch' : 'good' },
    { label: 'Timeline continuity', value: timeline.length >= 8 ? 'Strong life coverage' : 'More years can be added', tone: timeline.length >= 8 ? 'good' : 'neutral' },
  ];
  return (
    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Care signals</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">A gentle check-in layer for family memory.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          MemoryGraph can surface social and emotional patterns from conversations and memories. It is not a medical tool or diagnosis.
        </p>
        <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          {care?.disclaimer || 'For production, this page should stay careful: supportive language, family check-in suggestions, and clear clinical boundaries.'}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {careSignals.map((signal) => (
          <div key={signal.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{signal.label}</p>
            <p className="mt-2 text-xl font-bold text-slate-950">{signal.value}</p>
            <div className={`mt-4 h-2 rounded-full ${signal.tone === 'good' ? 'bg-emerald-200' : signal.tone === 'watch' ? 'bg-amber-200' : 'bg-slate-200'}`}>
              <div className={`h-full rounded-full ${signal.tone === 'good' ? 'w-4/5 bg-emerald-500' : signal.tone === 'watch' ? 'w-3/5 bg-amber-500' : 'w-2/5 bg-slate-400'}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceChips({ proof }: { proof: MemoryProofItem }) {
  const chips = [
    ...proof.evidence.people.map((value) => ({ value, tone: 'bg-emerald-50 text-emerald-700' })),
    ...proof.evidence.places.map((value) => ({ value, tone: 'bg-amber-50 text-amber-700' })),
    ...proof.evidence.events.map((value) => ({ value, tone: 'bg-cyan-50 text-cyan-700' })),
    ...proof.evidence.dates.map((value) => ({ value, tone: 'bg-slate-100 text-slate-700' })),
  ].slice(0, 10);
  return (
    <div className="flex flex-wrap gap-2">
      {chips.length === 0 ? (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Source text only</span>
      ) : (
        chips.map((chip) => (
          <span key={`${proof.memory_id}-${chip.value}`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chip.tone}`}>
            {chip.value}
          </span>
        ))
      )}
    </div>
  );
}

function MemoryProofSurface({ proofs, memories, askArchive }: { proofs: MemoryProofItem[]; memories: MemoryItem[]; askArchive: (question?: string) => Promise<void> }) {
  const visibleProofs = proofs.length
    ? proofs
    : memories.slice(0, 6).map((memory) => ({
        memory_id: memory.memory_id,
        title: memory.title,
        summary: memory.summary,
        evidence: { people: [], places: [], events: [], dates: [], excerpt: memory.raw_text || memory.summary },
        confidence: 0.5,
        created_at: memory.created_at,
      }));
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Memory proof mode</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Every insight shows where it came from.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Judges should be able to trust the magic. Proof Mode exposes the people, places, dates, events, and source excerpts behind each memory card.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {visibleProofs.map((proof) => (
          <div key={proof.memory_id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Source verified</p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">{proof.title}</h3>
              </div>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{Math.round(proof.confidence * 100)}%</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{proof.summary || proof.evidence.excerpt}</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm italic leading-6 text-slate-600">
              {proof.evidence.excerpt || 'Source excerpt will appear here as the archive grows.'}
            </div>
            <div className="mt-4">
              <EvidenceChips proof={proof} />
            </div>
            <button onClick={() => void askArchive(`Explain the proof behind ${proof.title}`)} className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-cyan-50">
              Ask about this proof
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LifeChaptersSurface({
  people,
  person,
  setPerson,
  chapters,
  buildChapters,
  exportBiography,
  busyAction,
}: {
  people: PersonProfileSummary[];
  person: string;
  setPerson: (value: string) => void;
  chapters: LifeChaptersPayload | null;
  buildChapters: (person?: string) => Promise<void>;
  exportBiography: (person?: string) => Promise<void>;
  busyAction: string | null;
}) {
  const activeChapters = chapters?.chapters || [];
  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Life chapter builder</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Turn scattered memories into a biography spine.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pick a person and MemoryGraph organizes source memories into chapters like education, work, family, turning points, and legacy.
        </p>
        <input
          value={person}
          onChange={(event) => setPerson(event.target.value)}
          list="memorygraph-people"
          className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          placeholder="Father, Grandfather, Sarah..."
        />
        <datalist id="memorygraph-people">
          {people.map((profile) => (
            <option key={profile.id} value={profile.name} />
          ))}
        </datalist>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button onClick={() => void buildChapters(person)} disabled={!!busyAction} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300">
            Build chapters
          </button>
          <button onClick={() => void exportBiography(person)} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-cyan-50">
            Export biography
          </button>
        </div>
        <div className="mt-5 rounded-lg bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
          This is the deployable version of the demo climax: not a timeline widget, but a source-backed life narrative families can keep.
        </div>
      </div>
      <div className="space-y-4">
        {activeChapters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-950">No chapter set yet</h3>
            <p className="mt-2 text-sm text-slate-500">Build chapters for a person to reveal biography sections with proof cards.</p>
          </div>
        ) : (
          activeChapters.map((chapter, index) => (
            <div key={`${chapter.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Chapter {index + 1}</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">{chapter.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{chapter.narrative}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {chapter.proof.slice(0, 2).map((proof) => (
                  <div key={`${chapter.title}-${proof.memory_id}`} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-semibold text-slate-950">{proof.title}</p>
                    <p className="mt-1 line-clamp-3 text-sm text-slate-600">{proof.evidence.excerpt}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {chapter.sources.slice(0, 5).map((source) => (
                  <span key={source} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FamilyRitualsSurface({
  rituals,
  createRitual,
  respondToRitual,
  emailRitual,
  askArchive,
  topPeople,
  userEmail,
}: {
  rituals: FamilyRitualItem[];
  createRitual: (title?: string) => Promise<void>;
  respondToRitual: (ritualId: string, question: string, answer: string) => Promise<void>;
  emailRitual: (ritualId: string) => Promise<void>;
  askArchive: (question?: string) => Promise<void>;
  topPeople: Array<[string, number]>;
  userEmail?: string;
}) {
  const starter = topPeople[0]?.[0] || 'grandfather';
  const [activeRitual, setActiveRitual] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Family rituals</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Make remembering a weekly habit.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Rituals turn archive intelligence into family prompts: dinner questions, Sunday calls, and memory nights powered by real source memories.
        </p>
        <div className="mt-5 grid gap-2">
          {['Sunday Memory Night', 'Grandchildren Story Call', 'Monthly Place Map'].map((title) => (
            <button key={title} onClick={() => void createRitual(title)} className="rounded-lg bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-slate-800">
              Create {title}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(rituals.length ? rituals : [{ ritual_id: 'empty', title: 'Create your first ritual', cadence: 'weekly', questions: [`Ask about ${starter}: what story should the family hear next?`], created_at: '' }]).map((ritual) => (
          <div key={ritual.ritual_id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ritual.cadence}</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">{ritual.title}</h3>
            <div className="mt-4 space-y-2">
              {ritual.questions.slice(0, 5).map((question) => (
                <button key={question} onClick={() => { setActiveRitual(ritual.ritual_id); setAnswer(''); }} className="block w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-cyan-50">
                  {question}
                </button>
              ))}
            </div>
            {(ritual.responses || []).length > 0 && (
              <p className="mt-3 text-xs font-semibold text-emerald-700">{ritual.responses!.length} answer(s) saved as memories</p>
            )}
            {activeRitual === ritual.ritual_id && ritual.ritual_id !== 'empty' && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Your family's answer becomes a new memory…" />
                <button onClick={() => void respondToRitual(ritual.ritual_id, ritual.questions[0] || '', answer)} className="w-full rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
                  Save to archive
                </button>
                <button onClick={() => void emailRitual(ritual.ritual_id)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600">
                  Email questions to {userEmail || 'me'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MemoryCapsulesSurface({
  capsules,
  createCapsule,
}: {
  capsules: MemoryCapsuleItem[];
  createCapsule: (payload: { title: string; message: string; recipient_name?: string; recipient_email?: string; unlock_at?: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState('A letter for someone you love');
  const [message, setMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-amber-800">Letters for later</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Write a message for the future</h2>
        <p className="mt-2 text-sm text-slate-600">Pick a date when someone special can open your letter.</p>
        <div className="mt-5 space-y-3">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Letter title" />
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Write your message…" />
          <input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Who is this for?" />
          <input value={unlockAt} onChange={(event) => setUnlockAt(event.target.value)} type="datetime-local" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" aria-label="Open on date" />
          <button type="button" onClick={() => void createCapsule({ title, message, recipient_name: recipientName, unlock_at: unlockAt })} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Schedule letter
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {capsules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">No letters scheduled yet</h3>
            <p className="mt-2 text-sm text-slate-500">Your scheduled letters will appear here with a share link.</p>
          </div>
        ) : (
          capsules.map((capsule) => (
            <div key={capsule.capsule_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-amber-800">Scheduled</p>
              <h3 className="mt-1 text-xl font-bold text-slate-950">{capsule.title}</h3>
              <p className="mt-2 text-sm text-slate-500">For {capsule.recipient_name || 'family'} · opens {formatDate(capsule.unlock_at)}</p>
              <Link href={`/capsules/${capsule.share_token}`} className="mt-4 inline-flex rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50">
                Preview link
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function LegacyContactsSurface({
  contacts,
  createContact,
}: {
  contacts: LegacyContactItem[];
  createContact: (payload: { name: string; email: string; relationship?: string; permissions: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const permissions = ['export_archive', 'receive_capsules', 'view_weekly_reports'];
  return (
    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Legacy contact</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Decide who can carry the archive forward.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">This is not an admin system. It is a family-first ownership layer for exports, capsules, and continuity.</p>
        <div className="mt-5 space-y-3">
          <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm" placeholder="Name" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm" placeholder="Email" />
          <input value={relationship} onChange={(event) => setRelationship(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm" placeholder="Relationship" />
          <button onClick={() => void createContact({ name, email, relationship, permissions })} className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Save legacy contact
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {contacts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm md:col-span-2">
            <h3 className="text-xl font-bold text-slate-950">No contacts saved</h3>
            <p className="mt-2 text-sm text-slate-500">Add one trusted family member to make the archive feel production-ready.</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.contact_id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{contact.relationship || 'Family'}</p>
              <h3 className="mt-1 text-xl font-bold text-slate-950">{contact.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{contact.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {contact.permissions.map((permission) => (
                  <span key={permission} className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                    {permission.replaceAll('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function TrustSurface({
  trust,
  exportArchive,
  exportAccountData,
  deleteAccount,
}: {
  trust: TrustPayload | null;
  exportArchive: (format: 'json' | 'csv' | 'html') => Promise<void>;
  exportAccountData: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}) {
  const [deletePassword, setDeletePassword] = useState('');
  const promises = trust?.privacy_promises || [
    'Your data belongs to you.',
    'Every answer should cite source memories.',
    'AI can run privately on your computer.',
  ];
  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-sm font-semibold text-amber-200">Settings</p>
        <h2 className="mt-2 text-4xl font-bold">Your data, your control</h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Export your memories, download account data, invite family, or delete your account. AI runs privately on your machine when enabled.
        </p>
        <button type="button" onClick={() => void exportArchive('json')} className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">
          Export my memories
        </button>
        <button onClick={() => void exportAccountData()} className="mt-3 rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
          Download GDPR export
        </button>
        <div className="mt-6 rounded-lg border border-red-400/30 bg-red-950/40 p-4">
          <p className="text-sm font-bold text-red-100">Delete account</p>
          <input
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            placeholder="Confirm password"
            className="mt-3 w-full rounded-lg border border-red-200/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-red-100/60"
          />
          <button
            onClick={() => void deleteAccount(deletePassword)}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Permanently delete account
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {promises.map((promise) => (
          <div key={promise} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm leading-7 text-slate-700">{promise}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OneLifeStorySurface({
  story,
  buildChapters,
  askArchive,
  exportBiography,
  shareStory,
}: {
  story: OneLifeStoryPayload | null;
  buildChapters: (person?: string) => Promise<void>;
  askArchive: (question?: string) => Promise<void>;
  exportBiography: (person?: string) => Promise<void>;
  shareStory: () => Promise<void>;
}) {
  const title = story?.title || 'A life story to share';
  const person = story?.person || 'Father';
  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-8 text-white shadow-sm">
        <Image
          src={familyImages[0].src}
          alt={familyImages[0].alt}
          fill
          priority
          sizes={HERO_PANEL_IMAGE_SIZES}
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/55" />
        <div className="relative max-w-4xl">
          <p className="text-sm font-semibold text-amber-200">Share a life story</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            One link your family can open — no account required. Built from real memories and sources.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => void buildChapters(person)} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">
              Refresh chapters
            </button>
            <button type="button" onClick={() => void askArchive(`What shaped ${person}?`)} className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15">
              Ask about {person}
            </button>
            <button type="button" onClick={() => void shareStory()} className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400">
              Copy share link
            </button>
          </div>
        </div>
      </div>
      {story?.memory_dna && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['What mattered', story.memory_dna.core_values.join(', ') || 'Still discovering'],
            ['Places', story.memory_dna.recurring_places.join(', ') || 'Still discovering'],
            ['People', story.memory_dna.important_people.join(', ') || 'Still discovering'],
            ['Sources', String(story.memory_dna.source_count)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-2 font-bold leading-6 text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {(story?.chapters || []).slice(0, 5).map((chapter, index) => (
            <div key={`${chapter.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-amber-800">Chapter {index + 1}</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">{chapter.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{chapter.narrative}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {(story?.proof || []).slice(0, 4).map((proof) => (
            <div key={proof.memory_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-amber-800">Source</p>
              <h3 className="mt-1 font-bold text-slate-950">{proof.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{proof.evidence.excerpt}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
