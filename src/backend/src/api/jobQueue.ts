import type { Job, JobStatus } from "./types.ts";

const jobs = new Map<string, Job>();

export function createJob(fach: string, lectureName: string): Job {
  const job: Job = {
    id: crypto.randomUUID(),
    fach,
    lectureName,
    status: "pending",
    outputFiles: [],
    createdAt: Date.now(),
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>): void {
  const job = jobs.get(id);
  if (job) jobs.set(id, { ...job, ...patch });
}

export function setJobStatus(id: string, status: JobStatus, error?: string): void {
  updateJob(id, { status, ...(error ? { error } : {}) });
}
