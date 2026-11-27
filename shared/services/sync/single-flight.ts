/**
 * One in-flight promise per key. Overlapping triggers reuse the active run, and
 * `whenIdle` awaits it so a caller (account purge) never races a cycle that is
 * already writing.
 */
export class SingleFlight<T> {
  private readonly active = new Map<string, Promise<T>>();

  run(key: string, work: () => Promise<T>): Promise<T> {
    const running = this.active.get(key);
    if (running) return running;

    const started = work().finally(() => {
      this.active.delete(key);
    });
    this.active.set(key, started);

    return started;
  }

  /**
   * Resolves when the key has no run in flight. The rejection of a finished run
   * is swallowed on purpose: the run records its own failure and the caller
   * only needs the writes to be over. No timeout.
   */
  async whenIdle(key: string): Promise<void> {
    const running = this.active.get(key);
    if (!running) return;

    try {
      await running;
    } catch {
      // Recorded by the run; the caller must keep going.
    }
  }
}
