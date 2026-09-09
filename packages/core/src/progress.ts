/**
 * Simple progress/status helpers (spinner-like output without extra deps).
 * Only writes when stdout is a TTY, so piped/scripted output stays clean.
 */

function isTty(): boolean {
  try {
    return Boolean(process.stdout.isTTY);
  } catch {
    return false;
  }
}

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class Progress {
  private timer: NodeJS.Timeout | null = null;
  private idx = 0;
  private label = "";

  start(text: string): void {
    if (!isTty()) return;
    this.label = text;
    this.timer = setInterval(() => {
      const frame = FRAMES[this.idx] ?? "";
      this.idx = (this.idx + 1) % FRAMES.length;
      process.stdout.write(`\r\u001b[90m${frame}\u001b[0m ${this.label}`);
    }, 80);
  }

  update(text: string): void {
    if (!isTty()) return;
    this.label = text;
  }

  stop(finalText?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (isTty()) {
      process.stdout.write("\r\u001b[K");
      if (finalText) process.stdout.write(`${finalText}\n`);
    }
  }
}