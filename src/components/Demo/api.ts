import type { Lecture } from "./types";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8080";

type ApiJob = {
  id: string;
  fach: string;
  lectureName: string;
  status: Lecture["status"];
  outputFiles: Record<string, string>;
  createdAt: number;
  mp3GcsPath?: string;
  pdfGcsPath?: string;
  error?: string;
};

function toLecture(job: ApiJob): Lecture {
  return {
    id: job.id,
    fach: job.fach,
    title: job.lectureName,
    status: job.status,
    outputFiles: job.outputFiles,
    createdAt: job.createdAt,
    mp3GcsPath: job.mp3GcsPath,
    pdfGcsPath: job.pdfGcsPath,
    error: job.error,
  };
}

export async function fetchJobs(): Promise<Lecture[]> {
  const res = await fetch(`${API_BASE}/api/jobs`);
  if (!res.ok) throw new Error(`fetchJobs failed: ${res.status}`);
  const jobs: ApiJob[] = await res.json();
  return jobs.map(toLecture);
}

export async function createJob(
  mp3: File,
  pdf: File,
  fach: string,
  lectureName: string,
): Promise<{ jobId: string }> {
  const form = new FormData();
  form.append("mp3", mp3);
  form.append("pdf", pdf);
  form.append("fach", fach);
  form.append("lectureName", lectureName);

  const res = await fetch(`${API_BASE}/api/jobs`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`createJob failed: ${res.status}`);
  return res.json();
}

export async function startJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/jobs/${id}/start`, { method: "POST" });
  if (!res.ok) throw new Error(`startJob failed: ${res.status}`);
}

export async function pollJob(id: string): Promise<Lecture> {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`);
  if (!res.ok) throw new Error(`pollJob failed: ${res.status}`);
  const job: ApiJob = await res.json();
  return toLecture(job);
}
