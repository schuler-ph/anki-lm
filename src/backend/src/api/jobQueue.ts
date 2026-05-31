import type { Job, JobStatus } from "./types.ts";

const jobs = new Map<string, Job>();

export function createJob(
  fach: string,
  lectureName: string,
  mp3GcsPath: string,
  pdfGcsPath: string,
): Job {
  const job: Job = {
    id: crypto.randomUUID(),
    fach,
    lectureName,
    status: "preparing",
    outputFiles: {},
    createdAt: Date.now(),
    mp3GcsPath,
    pdfGcsPath,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function listJobs(): Job[] {
  return [...jobs.values()];
}

export function updateJob(id: string, patch: Partial<Job>): void {
  const job = jobs.get(id);
  if (job) jobs.set(id, { ...job, ...patch });
}

export function setJobStatus(id: string, status: JobStatus, error?: string): void {
  updateJob(id, { status, ...(error ? { error } : {}) });
}

// Synchronous mutation — no awaits, so it cannot interleave with a concurrent call.
// Returns the new total count of stored output files.
export function addOutputFile(id: string, key: string, url: string): number {
  const job = jobs.get(id);
  if (!job) return 0;
  job.outputFiles[key] = url;
  return Object.keys(job.outputFiles).length;
}
