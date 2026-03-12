/**
 * Constants and mappings for NotebookLM API.
 * Single Source of Truth for all API constants, code mappings, and validation logic.
 */

// ============================================================================
// CodeMapper — Bidirectional mapping for API codes
// ============================================================================

export class CodeMapper {
  private nameToCode: Map<string, number>;
  private codeToName: Map<number, string>;
  private unknownLabel: string;
  private displayNames: string[];

  constructor(mapping: Record<string, number>, unknownLabel = "unknown") {
    this.nameToCode = new Map(
      Object.entries(mapping).map(([k, v]) => [k.toLowerCase(), v])
    );
    this.codeToName = new Map(
      Object.entries(mapping).map(([k, v]) => [v, k])
    );
    this.unknownLabel = unknownLabel;
    this.displayNames = Object.keys(mapping).sort();
  }

  getCode(name: string): number {
    if (!name) {
      throw new Error(
        `Invalid name: '${name}'. Must be one of: ${this.optionsStr}`
      );
    }
    const code = this.nameToCode.get(name.toLowerCase());
    if (code === undefined) {
      throw new Error(
        `Unknown name '${name}'. Must be one of: ${this.optionsStr}`
      );
    }
    return code;
  }

  getName(code: number | null | undefined): string {
    if (code === null || code === undefined) return this.unknownLabel;
    return this.codeToName.get(code) ?? this.unknownLabel;
  }

  get optionsStr(): string {
    return this.displayNames.join(", ");
  }

  get names(): string[] {
    return this.displayNames;
  }
}

// ============================================================================
// Ownership
// ============================================================================
export const OWNERSHIP_MINE = 1;
export const OWNERSHIP_SHARED = 2;

// ============================================================================
// RPC IDs
// ============================================================================
export const RPC = {
  // Notebook operations
  LIST_NOTEBOOKS: "wXbhsf",
  GET_NOTEBOOK: "rLM1Ne",
  CREATE_NOTEBOOK: "CCqFvf",
  RENAME_NOTEBOOK: "s0tc2d",
  DELETE_NOTEBOOK: "WWINqb",

  // Source operations
  ADD_SOURCE: "izAoDd",
  ADD_SOURCE_FILE: "o4cbdc",
  GET_SOURCE: "hizoJc",
  CHECK_FRESHNESS: "yR9Yof",
  SYNC_DRIVE: "FLmJqe",
  DELETE_SOURCE: "tGMBJ",
  RENAME_SOURCE: "b7Wfje",

  // Misc
  GET_CONVERSATIONS: "hPTbtc",
  PREFERENCES: "hT54vc",
  SUBSCRIPTION: "ozz5Z",
  SETTINGS: "ZwVcOc",
  GET_SUMMARY: "VfAZjd",
  GET_SOURCE_GUIDE: "tr032e",

  // Research
  START_FAST_RESEARCH: "Ljjv0c",
  START_DEEP_RESEARCH: "QA9ei",
  POLL_RESEARCH: "e3bVqc",
  IMPORT_RESEARCH: "LBwxtb",

  // Studio content
  CREATE_STUDIO: "R7cb6c",
  POLL_STUDIO: "gArtLc",
  DELETE_STUDIO: "V5N4be",
  RENAME_ARTIFACT: "rc3d8d",
  GET_INTERACTIVE_HTML: "v9rmvd",
  REVISE_SLIDE_DECK: "KmcKPe",

  // Mind map
  GENERATE_MIND_MAP: "yyryJe",
  SAVE_MIND_MAP: "CYK0Xb",
  LIST_MIND_MAPS: "cFji9",
  DELETE_MIND_MAP: "AH0mwd",

  // Notes (share some IDs with mind maps)
  CREATE_NOTE: "CYK0Xb",
  GET_NOTES: "cFji9",
  UPDATE_NOTE: "cYAfTb",
  DELETE_NOTE: "AH0mwd",

  // Sharing
  SHARE_NOTEBOOK: "QDyure",
  GET_SHARE_STATUS: "JFMDGd",

  // Export
  EXPORT_ARTIFACT: "Krh3pd",
} as const;

/** RPC ID to human-readable name mapping for debug logging */
export const RPC_NAMES: Record<string, string> = {
  [RPC.LIST_NOTEBOOKS]: "ListNotebooks",
  [RPC.GET_NOTEBOOK]: "GetNotebook",
  [RPC.CREATE_NOTEBOOK]: "CreateNotebook",
  [RPC.RENAME_NOTEBOOK]: "RenameNotebook",
  [RPC.DELETE_NOTEBOOK]: "DeleteNotebook",
  [RPC.ADD_SOURCE]: "AddSource",
  [RPC.ADD_SOURCE_FILE]: "AddSourceFile",
  [RPC.GET_SOURCE]: "GetSource",
  [RPC.CHECK_FRESHNESS]: "CheckFreshness",
  [RPC.SYNC_DRIVE]: "SyncDrive",
  [RPC.DELETE_SOURCE]: "DeleteSource",
  [RPC.RENAME_SOURCE]: "RenameSource",
  [RPC.GET_SUMMARY]: "GetSummary",
  [RPC.GET_SOURCE_GUIDE]: "GetSourceGuide",
  [RPC.START_FAST_RESEARCH]: "StartFastResearch",
  [RPC.START_DEEP_RESEARCH]: "StartDeepResearch",
  [RPC.POLL_RESEARCH]: "PollResearch",
  [RPC.IMPORT_RESEARCH]: "ImportResearch",
  [RPC.CREATE_STUDIO]: "CreateStudio",
  [RPC.POLL_STUDIO]: "PollStudio",
  [RPC.DELETE_STUDIO]: "DeleteStudio",
  [RPC.RENAME_ARTIFACT]: "RenameArtifact",
  [RPC.GET_INTERACTIVE_HTML]: "GetInteractiveHtml",
  [RPC.REVISE_SLIDE_DECK]: "ReviseSlideDeck",
  [RPC.GENERATE_MIND_MAP]: "GenerateMindMap",
  [RPC.SAVE_MIND_MAP]: "SaveMindMap",
  [RPC.LIST_MIND_MAPS]: "ListMindMaps",
  [RPC.DELETE_MIND_MAP]: "DeleteMindMap",
  [RPC.UPDATE_NOTE]: "UpdateNote",
  [RPC.SHARE_NOTEBOOK]: "ShareNotebook",
  [RPC.GET_SHARE_STATUS]: "GetShareStatus",
  [RPC.EXPORT_ARTIFACT]: "ExportArtifact",
};

// ============================================================================
// Chat Configuration
// ============================================================================
export const CHAT_GOAL_DEFAULT = 1;
export const CHAT_GOAL_CUSTOM = 2;
export const CHAT_GOAL_LEARNING_GUIDE = 3;

export const CHAT_GOALS = new CodeMapper({
  default: CHAT_GOAL_DEFAULT,
  custom: CHAT_GOAL_CUSTOM,
  learning_guide: CHAT_GOAL_LEARNING_GUIDE,
});

export const CHAT_RESPONSE_DEFAULT = 1;
export const CHAT_RESPONSE_LONGER = 4;
export const CHAT_RESPONSE_SHORTER = 5;

export const CHAT_RESPONSE_LENGTHS = new CodeMapper({
  default: CHAT_RESPONSE_DEFAULT,
  longer: CHAT_RESPONSE_LONGER,
  shorter: CHAT_RESPONSE_SHORTER,
});

// ============================================================================
// Research / Source Discovery
// ============================================================================
export const RESEARCH_SOURCE_WEB = 1;
export const RESEARCH_SOURCE_DRIVE = 2;

export const RESEARCH_SOURCES = new CodeMapper({
  web: RESEARCH_SOURCE_WEB,
  drive: RESEARCH_SOURCE_DRIVE,
});

export const RESEARCH_MODE_FAST = 1;
export const RESEARCH_MODE_DEEP = 5;

export const RESEARCH_MODES = new CodeMapper({
  fast: RESEARCH_MODE_FAST,
  deep: RESEARCH_MODE_DEEP,
});

export const RESULT_TYPE_WEB = 1;
export const RESULT_TYPE_GOOGLE_DOC = 2;
export const RESULT_TYPE_GOOGLE_SLIDES = 3;
export const RESULT_TYPE_DEEP_REPORT = 5;
export const RESULT_TYPE_GOOGLE_SHEETS = 8;

export const RESULT_TYPES = new CodeMapper({
  web: RESULT_TYPE_WEB,
  google_doc: RESULT_TYPE_GOOGLE_DOC,
  google_slides: RESULT_TYPE_GOOGLE_SLIDES,
  deep_report: RESULT_TYPE_DEEP_REPORT,
  google_sheets: RESULT_TYPE_GOOGLE_SHEETS,
});

// ============================================================================
// Source Types (Notebook Content)
// ============================================================================
export const SOURCE_TYPE_GOOGLE_DOCS = 1;
export const SOURCE_TYPE_GOOGLE_OTHER = 2;
export const SOURCE_TYPE_PDF = 3;
export const SOURCE_TYPE_PASTED_TEXT = 4;
export const SOURCE_TYPE_WEB_PAGE = 5;
export const SOURCE_TYPE_GENERATED_TEXT = 8;
export const SOURCE_TYPE_YOUTUBE = 9;
export const SOURCE_TYPE_UPLOADED_FILE = 11;
export const SOURCE_TYPE_IMAGE = 13;
export const SOURCE_TYPE_WORD_DOC = 14;

export const SOURCE_TYPES = new CodeMapper({
  google_docs: SOURCE_TYPE_GOOGLE_DOCS,
  google_slides_sheets: SOURCE_TYPE_GOOGLE_OTHER,
  pdf: SOURCE_TYPE_PDF,
  pasted_text: SOURCE_TYPE_PASTED_TEXT,
  web_page: SOURCE_TYPE_WEB_PAGE,
  generated_text: SOURCE_TYPE_GENERATED_TEXT,
  youtube: SOURCE_TYPE_YOUTUBE,
  uploaded_file: SOURCE_TYPE_UPLOADED_FILE,
  image: SOURCE_TYPE_IMAGE,
  word_doc: SOURCE_TYPE_WORD_DOC,
});

// ============================================================================
// Studio Types
// ============================================================================
export const STUDIO_TYPE_AUDIO = 1;
export const STUDIO_TYPE_REPORT = 2;
export const STUDIO_TYPE_VIDEO = 3;
export const STUDIO_TYPE_FLASHCARDS = 4;
export const STUDIO_TYPE_INFOGRAPHIC = 7;
export const STUDIO_TYPE_SLIDE_DECK = 8;
export const STUDIO_TYPE_DATA_TABLE = 9;

export const STUDIO_TYPES = new CodeMapper({
  audio: STUDIO_TYPE_AUDIO,
  report: STUDIO_TYPE_REPORT,
  video: STUDIO_TYPE_VIDEO,
  flashcards: STUDIO_TYPE_FLASHCARDS,
  infographic: STUDIO_TYPE_INFOGRAPHIC,
  slide_deck: STUDIO_TYPE_SLIDE_DECK,
  data_table: STUDIO_TYPE_DATA_TABLE,
});

export const STUDIO_ARTIFACT_FOCUS_INDEX = 6;

// ============================================================================
// Audio Overview
// ============================================================================
export const AUDIO_FORMAT_DEEP_DIVE = 1;
export const AUDIO_FORMAT_BRIEF = 2;
export const AUDIO_FORMAT_CRITIQUE = 3;
export const AUDIO_FORMAT_DEBATE = 4;

export const AUDIO_FORMATS = new CodeMapper({
  deep_dive: AUDIO_FORMAT_DEEP_DIVE,
  brief: AUDIO_FORMAT_BRIEF,
  critique: AUDIO_FORMAT_CRITIQUE,
  debate: AUDIO_FORMAT_DEBATE,
});

export const AUDIO_LENGTH_SHORT = 1;
export const AUDIO_LENGTH_DEFAULT = 2;
export const AUDIO_LENGTH_LONG = 3;

export const AUDIO_LENGTHS = new CodeMapper({
  short: AUDIO_LENGTH_SHORT,
  default: AUDIO_LENGTH_DEFAULT,
  long: AUDIO_LENGTH_LONG,
});

// ============================================================================
// Video Overview
// ============================================================================
export const VIDEO_FORMAT_EXPLAINER = 1;
export const VIDEO_FORMAT_BRIEF = 2;
export const VIDEO_FORMAT_CINEMATIC = 3;

export const VIDEO_FORMATS = new CodeMapper({
  explainer: VIDEO_FORMAT_EXPLAINER,
  brief: VIDEO_FORMAT_BRIEF,
  cinematic: VIDEO_FORMAT_CINEMATIC,
});

export const VIDEO_STYLE_AUTO_SELECT = 1;
export const VIDEO_STYLE_CUSTOM = 2;
export const VIDEO_STYLE_CLASSIC = 3;
export const VIDEO_STYLE_WHITEBOARD = 4;
export const VIDEO_STYLE_KAWAII = 5;
export const VIDEO_STYLE_ANIME = 6;
export const VIDEO_STYLE_WATERCOLOR = 7;
export const VIDEO_STYLE_RETRO_PRINT = 8;
export const VIDEO_STYLE_HERITAGE = 9;
export const VIDEO_STYLE_PAPER_CRAFT = 10;

export const VIDEO_STYLES = new CodeMapper({
  auto_select: VIDEO_STYLE_AUTO_SELECT,
  custom: VIDEO_STYLE_CUSTOM,
  classic: VIDEO_STYLE_CLASSIC,
  whiteboard: VIDEO_STYLE_WHITEBOARD,
  kawaii: VIDEO_STYLE_KAWAII,
  anime: VIDEO_STYLE_ANIME,
  watercolor: VIDEO_STYLE_WATERCOLOR,
  retro_print: VIDEO_STYLE_RETRO_PRINT,
  heritage: VIDEO_STYLE_HERITAGE,
  paper_craft: VIDEO_STYLE_PAPER_CRAFT,
});

// ============================================================================
// Infographic
// ============================================================================
export const INFOGRAPHIC_ORIENTATION_LANDSCAPE = 1;
export const INFOGRAPHIC_ORIENTATION_PORTRAIT = 2;
export const INFOGRAPHIC_ORIENTATION_SQUARE = 3;

export const INFOGRAPHIC_ORIENTATIONS = new CodeMapper({
  landscape: INFOGRAPHIC_ORIENTATION_LANDSCAPE,
  portrait: INFOGRAPHIC_ORIENTATION_PORTRAIT,
  square: INFOGRAPHIC_ORIENTATION_SQUARE,
});

export const INFOGRAPHIC_DETAIL_CONCISE = 1;
export const INFOGRAPHIC_DETAIL_STANDARD = 2;
export const INFOGRAPHIC_DETAIL_DETAILED = 3;

export const INFOGRAPHIC_DETAILS = new CodeMapper({
  concise: INFOGRAPHIC_DETAIL_CONCISE,
  standard: INFOGRAPHIC_DETAIL_STANDARD,
  detailed: INFOGRAPHIC_DETAIL_DETAILED,
});

export const INFOGRAPHIC_STYLE_AUTO_SELECT = 1;
export const INFOGRAPHIC_STYLE_SKETCH_NOTE = 2;
export const INFOGRAPHIC_STYLE_PROFESSIONAL = 3;
export const INFOGRAPHIC_STYLE_BENTO_GRID = 4;
export const INFOGRAPHIC_STYLE_EDITORIAL = 5;
export const INFOGRAPHIC_STYLE_INSTRUCTIONAL = 6;
export const INFOGRAPHIC_STYLE_BRICKS = 7;
export const INFOGRAPHIC_STYLE_CLAY = 8;
export const INFOGRAPHIC_STYLE_ANIME = 9;
export const INFOGRAPHIC_STYLE_KAWAII = 10;
export const INFOGRAPHIC_STYLE_SCIENTIFIC = 11;

export const INFOGRAPHIC_STYLES = new CodeMapper({
  auto_select: INFOGRAPHIC_STYLE_AUTO_SELECT,
  sketch_note: INFOGRAPHIC_STYLE_SKETCH_NOTE,
  professional: INFOGRAPHIC_STYLE_PROFESSIONAL,
  bento_grid: INFOGRAPHIC_STYLE_BENTO_GRID,
  editorial: INFOGRAPHIC_STYLE_EDITORIAL,
  instructional: INFOGRAPHIC_STYLE_INSTRUCTIONAL,
  bricks: INFOGRAPHIC_STYLE_BRICKS,
  clay: INFOGRAPHIC_STYLE_CLAY,
  anime: INFOGRAPHIC_STYLE_ANIME,
  kawaii: INFOGRAPHIC_STYLE_KAWAII,
  scientific: INFOGRAPHIC_STYLE_SCIENTIFIC,
});

// ============================================================================
// Slide Deck
// ============================================================================
export const SLIDE_DECK_FORMAT_DETAILED = 1;
export const SLIDE_DECK_FORMAT_PRESENTER = 2;

export const SLIDE_DECK_FORMATS = new CodeMapper({
  detailed_deck: SLIDE_DECK_FORMAT_DETAILED,
  presenter_slides: SLIDE_DECK_FORMAT_PRESENTER,
});

export const SLIDE_DECK_LENGTH_SHORT = 1;
export const SLIDE_DECK_LENGTH_DEFAULT = 3;

export const SLIDE_DECK_LENGTHS = new CodeMapper({
  short: SLIDE_DECK_LENGTH_SHORT,
  default: SLIDE_DECK_LENGTH_DEFAULT,
});

// ============================================================================
// Flashcards / Quiz
// ============================================================================
export const FLASHCARD_DIFFICULTY_EASY = 1;
export const FLASHCARD_DIFFICULTY_MEDIUM = 2;
export const FLASHCARD_DIFFICULTY_HARD = 3;

export const FLASHCARD_DIFFICULTIES = new CodeMapper({
  easy: FLASHCARD_DIFFICULTY_EASY,
  medium: FLASHCARD_DIFFICULTY_MEDIUM,
  hard: FLASHCARD_DIFFICULTY_HARD,
});

export const FLASHCARD_COUNT_DEFAULT = 2;

// ============================================================================
// Reports
// ============================================================================
export const REPORT_FORMAT_BRIEFING_DOC = "Briefing Doc";
export const REPORT_FORMAT_STUDY_GUIDE = "Study Guide";
export const REPORT_FORMAT_BLOG_POST = "Blog Post";
export const REPORT_FORMAT_CUSTOM = "Create Your Own";

// ============================================================================
// Sharing / Access Control
// ============================================================================
export const SHARE_ROLE_OWNER = 1;
export const SHARE_ROLE_EDITOR = 2;
export const SHARE_ROLE_VIEWER = 3;

export const SHARE_ROLES = new CodeMapper({
  owner: SHARE_ROLE_OWNER,
  editor: SHARE_ROLE_EDITOR,
  viewer: SHARE_ROLE_VIEWER,
});

export const SHARE_ACCESS_RESTRICTED = 0;
export const SHARE_ACCESS_PUBLIC = 1;

export const SHARE_ACCESS_LEVELS = new CodeMapper({
  restricted: SHARE_ACCESS_RESTRICTED,
  public: SHARE_ACCESS_PUBLIC,
});

// ============================================================================
// Export Types
// ============================================================================
export const EXPORT_TYPE_DOCS = 1;
export const EXPORT_TYPE_SHEETS = 2;

export const EXPORT_TYPES = new CodeMapper({
  docs: EXPORT_TYPE_DOCS,
  sheets: EXPORT_TYPE_SHEETS,
});

// ============================================================================
// URLs
// ============================================================================
export const BASE_URL = "https://notebooklm.google.com";
export const BATCHEXECUTE_URL = `${BASE_URL}/_/LabsTailwindUi/data/batchexecute`;
export const UPLOAD_URL = `${BASE_URL}/upload/_/`;
export const QUERY_ENDPOINT =
  "/_/LabsTailwindUi/data/google.internal.labs.tailwind.orchestration.v1.LabsTailwindOrchestrationService/GenerateFreeFormStreamed";
export const BL_FALLBACK = "boq_labs-tailwind-frontend_20260108.06_p0";

// ============================================================================
// Timeouts (seconds)
// ============================================================================
export const DEFAULT_TIMEOUT = 30_000; // 30s in ms
export const SOURCE_ADD_TIMEOUT = 120_000; // 120s in ms

// ============================================================================
// Retry
// ============================================================================
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_BASE_DELAY = 1_000; // 1s in ms
export const DEFAULT_MAX_DELAY = 30_000; // 30s in ms

// ============================================================================
// Essential cookies
// ============================================================================
export const ESSENTIAL_COOKIES = [
  "SID",
  "HSID",
  "SSID",
  "APISID",
  "SAPISID",
  "__Secure-1PSID",
  "__Secure-3PSID",
  "__Secure-1PAPISID",
  "__Secure-3PAPISID",
  "OSID",
  "__Secure-OSID",
  "__Secure-1PSIDTS",
  "__Secure-3PSIDTS",
  "SIDCC",
  "__Secure-1PSIDCC",
  "__Secure-3PSIDCC",
];

export const REQUIRED_COOKIES = ["SID", "HSID", "SSID", "APISID", "SAPISID"];
