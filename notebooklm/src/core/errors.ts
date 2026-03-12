/**
 * Custom error classes for NotebookLM MCP.
 */

export class NotebookLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotebookLMError";
  }
}

export class AuthenticationError extends NotebookLMError {
  public hint?: string;

  constructor(message: string, hint?: string) {
    super(message);
    this.name = "AuthenticationError";
    this.hint = hint;
  }
}

export class ServiceError extends NotebookLMError {
  public userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = "ServiceError";
    this.userMessage = userMessage ?? message;
  }
}

export class ValidationError extends NotebookLMError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ArtifactError extends NotebookLMError {
  constructor(message: string) {
    super(message);
    this.name = "ArtifactError";
  }
}

export class ArtifactNotReadyError extends ArtifactError {
  constructor(message: string = "Artifact is not ready yet") {
    super(message);
    this.name = "ArtifactNotReadyError";
  }
}

export class ArtifactNotFoundError extends ArtifactError {
  constructor(message: string = "Artifact not found") {
    super(message);
    this.name = "ArtifactNotFoundError";
  }
}

export class ArtifactDownloadError extends ArtifactError {
  constructor(message: string) {
    super(message);
    this.name = "ArtifactDownloadError";
  }
}
