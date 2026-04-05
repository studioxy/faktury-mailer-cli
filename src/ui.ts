const RESET = "\u001B[0m";
const BOLD = "\u001B[1m";
const DIM = "\u001B[2m";
const ORANGE = "\u001B[38;5;214m";
const BLUE = "\u001B[38;5;39m";
const GREEN = "\u001B[38;5;41m";
const RED = "\u001B[38;5;196m";
const GRAY = "\u001B[38;5;245m";
const FRAMES = ["⠋", "⠙", "⠸", "⠴", "⠦", "⠇"];

function colorize(enabled: boolean, color: string, text: string): string {
  return enabled ? `${color}${text}${RESET}` : text;
}

function emphasis(enabled: boolean, text: string): string {
  return enabled ? `${BOLD}${text}${RESET}` : text;
}

function dim(enabled: boolean, text: string): string {
  return enabled ? `${DIM}${text}${RESET}` : text;
}

export interface ConsoleUi {
  colorEnabled: boolean;
  printHeader(title: string, subtitleLines: string[]): void;
  info(message: string): void;
  warn(message: string): void;
  success(message: string): void;
  fail(message: string): void;
  createStep(label: string): {
    update(message: string): void;
    succeed(message?: string): void;
    warn(message?: string): void;
    fail(message?: string): void;
  };
}

export function createConsoleUi(): ConsoleUi {
  const colorEnabled = Boolean(process.stdout.isTTY);
  const spinnerEnabled = Boolean(process.stdout.isTTY);

  return {
    colorEnabled,
    printHeader(title, subtitleLines) {
      const line = "═".repeat(68);
      console.log(colorize(colorEnabled, BLUE, line));
      console.log(
        `${colorize(colorEnabled, ORANGE, "◆")} ${emphasis(colorEnabled, title)}`,
      );
      for (const subtitle of subtitleLines) {
        console.log(`${colorize(colorEnabled, BLUE, "│")} ${dim(colorEnabled, subtitle)}`);
      }
      console.log(colorize(colorEnabled, BLUE, line));
    },
    info(message) {
      console.log(`${colorize(colorEnabled, BLUE, "ℹ")} ${message}`);
    },
    warn(message) {
      console.log(`${colorize(colorEnabled, ORANGE, "▲")} ${message}`);
    },
    success(message) {
      console.log(`${colorize(colorEnabled, GREEN, "✓")} ${message}`);
    },
    fail(message) {
      console.log(`${colorize(colorEnabled, RED, "✗")} ${message}`);
    },
    createStep(label) {
      let timer: NodeJS.Timeout | undefined;
      let frameIndex = 0;
      let currentMessage = label;

      const render = () => {
        const frame = FRAMES[frameIndex % FRAMES.length];
        frameIndex += 1;
        process.stdout.write(
          `\r${colorize(colorEnabled, BLUE, frame)} ${emphasis(colorEnabled, label)} ${dim(
            colorEnabled,
            currentMessage,
          )}   `,
        );
      };

      if (spinnerEnabled) {
        render();
        timer = setInterval(render, 90);
      } else {
        console.log(`${colorize(colorEnabled, BLUE, "…")} ${label}`);
      }

      const stop = (icon: string, color: string, message?: string) => {
        if (timer) {
          clearInterval(timer);
          timer = undefined;
          process.stdout.write("\r");
        }
        const finalMessage = message ?? currentMessage;
        console.log(
          `${colorize(colorEnabled, color, icon)} ${emphasis(colorEnabled, label)} ${finalMessage}`,
        );
      };

      return {
        update(message: string) {
          currentMessage = message;
          if (!spinnerEnabled) {
            console.log(`${colorize(colorEnabled, BLUE, "→")} ${label} ${message}`);
          }
        },
        succeed(message?: string) {
          stop("✓", GREEN, message);
        },
        warn(message?: string) {
          stop("▲", ORANGE, message);
        },
        fail(message?: string) {
          stop("✗", RED, message);
        },
      };
    },
  };
}

export function uiPalette() {
  return {
    blue: BLUE,
    orange: ORANGE,
    green: GREEN,
    red: RED,
    gray: GRAY,
    reset: RESET,
    bold: BOLD,
  };
}

export function paint(enabled: boolean, tone: "blue" | "orange" | "green" | "red" | "gray", text: string): string {
  const palette = uiPalette();
  return colorize(enabled, palette[tone], text);
}

export function strong(enabled: boolean, text: string): string {
  return emphasis(enabled, text);
}

export function badge(
  enabled: boolean,
  tone: "blue" | "orange" | "green" | "red" | "gray",
  text: string,
): string {
  return `${paint(enabled, tone, "[")}${strong(enabled, text)}${paint(enabled, tone, "]")}`;
}
