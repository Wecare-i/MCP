/**
 * TypeScript interfaces and types for NotebookLM MCP.
 */

// ============================================================================
// Auth
// ============================================================================

export interface AuthTokens {
  cookies: CookieRecord[] | Record<string, string>;
  csrfToken: string;
  sessionId: string;
  buildLabel: string;
  extractedAt: number;
}

export interface CookieRecord {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

// ============================================================================
// Notebooks
// ============================================================================

export interface Notebook {
  id: string;
  title: string;
  sourceCount: number;
  url: string;
  ownership?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Source {
  id: string;
  title: string;
  type: string;
  typeCode?: number;
  url?: string;
  isFresh?: boolean;
  driveDocId?: string;
}

// ============================================================================
// Studio
// ============================================================================

export interface Artifact {
  artifactId: string;
  title: string;
  type: string;
  status: "completed" | "in_progress" | "failed";
  url?: string;
  customInstructions?: string;
}

export interface StudioStatus {
  total: number;
  completed: number;
  inProgress: number;
  artifacts: Artifact[];
}

// ============================================================================
// Chat / Conversation
// ============================================================================

export interface ConversationTurn {
  query: string;
  answer: string;
  sourceIds?: string[];
}

// ============================================================================
// Sharing
// ============================================================================

export interface Collaborator {
  email: string;
  role: number;
  displayName?: string;
}

export interface ShareStatus {
  isPublic: boolean;
  publicUrl?: string;
  collaborators: Collaborator[];
}

// ============================================================================
// Research
// ============================================================================

export interface ResearchSource {
  title: string;
  url: string;
  snippet?: string;
  resultType: number;
  documentId?: string;
}

// ============================================================================
// Tool Response
// ============================================================================

export interface ToolResponse {
  status: "success" | "error" | "pending_confirmation";
  error?: string;
  warning?: string;
  hint?: string;
  message?: string;
  [key: string]: unknown;
}
