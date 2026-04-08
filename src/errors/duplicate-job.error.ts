/**
 * Thrown when trying to schedule a job whose name is already registered.
 *
 * @example
 * ```typescript
 * throw new DuplicateJobError('send-report');
 * // → "Job 'send-report' is already registered. Use reschedule() to change its timing."
 * ```
 */
export class DuplicateJobError extends Error {
  constructor(name: string) {
    super(`Job '${name}' is already registered. Use reschedule() to change its timing.`);
    this.name = "DuplicateJobError";
    // Maintains proper prototype chain in transpiled ES5 targets
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
