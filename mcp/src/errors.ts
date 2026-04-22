import { ZodError } from 'zod';
import { AuthError } from './auth';
import {
  ForbiddenError,
  InvalidParamsError,
  NotFoundError,
  UpstreamError
} from './apiClient';

/**
 * Translate caught errors into MCP tool-result errors with clear messages the
 * LLM can reason about.
 */
export function toToolError(err: unknown): { content: { type: 'text'; text: string }[]; isError: true } {
  let message: string;
  if (err instanceof ZodError) {
    message = `Invalid arguments: ${err.issues.map(i => `${i.path.join('.') || '(root)'} ${i.message}`).join('; ')}`;
  } else if (err instanceof InvalidParamsError) {
    message = `Invalid arguments: ${err.message}`;
  } else if (err instanceof AuthError) {
    message = `Authentication error: ${err.message}`;
  } else if (err instanceof ForbiddenError) {
    const perm = err.requiredPermission ? ` (required permission: ${err.requiredPermission})` : '';
    message = `Forbidden: ${err.message}${perm}`;
  } else if (err instanceof NotFoundError) {
    message = `Not found: ${err.message}`;
  } else if (err instanceof UpstreamError) {
    message = `Upstream error (${err.status}): ${err.message}`;
  } else if (err instanceof Error) {
    message = err.message;
  } else {
    message = 'Unknown error';
  }

  return {
    content: [{ type: 'text', text: message }],
    isError: true
  };
}
