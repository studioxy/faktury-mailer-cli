import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export function buildConfirmationToken(readyCount: number): string {
  return `SEND ${readyCount}`;
}

export function validateConfirmation(answer: string, readyCount: number): boolean {
  return answer.trim() === buildConfirmationToken(readyCount);
}

export async function promptForSendConfirmation(readyCount: number): Promise<boolean> {
  const token = buildConfirmationToken(readyCount);
  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(`Type "${token}" to continue: `);
    return validateConfirmation(answer, readyCount);
  } finally {
    rl.close();
  }
}
