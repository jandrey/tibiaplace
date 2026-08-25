export type ImportStep =
  | "validate"
  | "fetch"
  | "catalog"
  | "listing"
  | "relations"
  | "slug"
  | "done"
  | "error";

export type ImportProgressEvent = {
  step: ImportStep;
  label: string;
  progress: number;
  detail?: string;
};

export type ImportDoneEvent = ImportProgressEvent & {
  step: "done";
  listingId: string;
  slug: string;
};

export type ImportErrorEvent = {
  step: "error";
  error: string;
};

export type ImportStreamEvent =
  | ImportProgressEvent
  | ImportDoneEvent
  | ImportErrorEvent;

export type ImportProgressReporter = (event: ImportProgressEvent) => void;

export function encodeImportEvent(event: ImportStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function consumeImportStream(
  response: Response,
  onEvent: (event: ImportStreamEvent) => void,
): Promise<ImportDoneEvent | null> {
  if (!response.ok && !response.body) {
    let message = `Erro ${response.status}`;
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Resposta sem corpo");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done: ImportDoneEvent | null = null;

  while (true) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const event = JSON.parse(trimmed) as ImportStreamEvent;
      onEvent(event);
      if (event.step === "done") done = event as ImportDoneEvent;
      if (event.step === "error") {
        throw new Error((event as ImportErrorEvent).error);
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    const event = JSON.parse(tail) as ImportStreamEvent;
    onEvent(event);
    if (event.step === "done") done = event as ImportDoneEvent;
    if (event.step === "error") {
      throw new Error((event as ImportErrorEvent).error);
    }
  }

  return done;
}
