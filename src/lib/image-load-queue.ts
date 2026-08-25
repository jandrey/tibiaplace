/**
 * Site-wide image fetch queue — prevents ERR_INSUFFICIENT_RESOURCES when
 * hundreds of sprites mount at once (items grid, cosmetics, catalog picker).
 */
const MAX_CONCURRENT = 6;

let activeLoads = 0;
const waitQueue: Array<() => void> = [];

function pumpQueue() {
  while (activeLoads < MAX_CONCURRENT && waitQueue.length > 0) {
    const next = waitQueue.shift();
    next?.();
  }
}

export function acquireImageSlot(): Promise<void> {
  if (activeLoads < MAX_CONCURRENT) {
    activeLoads += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      activeLoads += 1;
      resolve();
    });
  });
}

export function releaseImageSlot() {
  activeLoads = Math.max(0, activeLoads - 1);
  pumpQueue();
}

export type ImageProbeResult = "ok" | "fail";

export function probeImageUrl(url: string): Promise<ImageProbeResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (img.naturalWidth < 8 || img.naturalHeight < 8) {
        resolve("fail");
        return;
      }
      resolve("ok");
    };
    img.onerror = () => resolve("fail");
    img.src = url;
  });
}

const inflight = new Map<string, Promise<ImageProbeResult>>();

/** Probe a URL through the global queue (deduped per URL). */
export function queuedImageProbe(url: string): Promise<ImageProbeResult> {
  const pending = inflight.get(url);
  if (pending) return pending;

  const job = (async () => {
    await acquireImageSlot();
    try {
      return await probeImageUrl(url);
    } finally {
      inflight.delete(url);
      releaseImageSlot();
    }
  })();

  inflight.set(url, job);
  return job;
}
