import type { Lecture } from "./types";

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8080";

let _getToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = _getToken ? await _getToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ApiJob = {
  id: string;
  fach: string;
  lectureName: string;
  status: Lecture["status"];
  outputFiles: Record<string, string>;
  createdAt: number;
  mp3GcsPaths?: string[];
  pdfGcsPaths?: string[];
  mp3OriginalNames?: string[];
  pdfOriginalNames?: string[];
  fachDisplayName?: string;
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
    mp3GcsPaths: job.mp3GcsPaths,
    pdfGcsPaths: job.pdfGcsPaths,
    mp3OriginalNames: job.mp3OriginalNames,
    pdfOriginalNames: job.pdfOriginalNames,
    fachDisplayName: job.fachDisplayName,
    error: job.error,
  };
}

export async function fetchJobs(): Promise<Lecture[]> {
  const res = await fetch(`${API_BASE}/api/jobs`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchJobs failed: ${res.status}`);
  const jobs: ApiJob[] = await res.json();
  return jobs.map(toLecture);
}

export async function createJob(
  mp3s: File[],
  pdfs: File[],
  fach: string,
  lectureName: string,
  fachDisplayName?: string,
): Promise<{ jobId: string }> {
  type UploadUrl = {
    index: number;
    fileType: "mp3" | "pdf";
    gcsPath: string;
    signedUrl: string;
  };

  // Step 1: send only metadata + file descriptors — no bytes go through Cloud Run.
  const res = await fetch(`${API_BASE}/api/jobs`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({
      fach,
      lectureName,
      fachDisplayName: fachDisplayName ?? undefined,
      files: [
        ...mp3s.map((f) => ({
          name: f.name,
          fileType: "mp3",
          contentType: f.type || "audio/mpeg",
        })),
        ...pdfs.map((f) => ({
          name: f.name,
          fileType: "pdf",
          contentType: f.type || "application/pdf",
        })),
      ],
    }),
  });
  if (!res.ok) throw new Error(`createJob failed: ${res.status}`);
  const { jobId, uploadUrls }: { jobId: string; uploadUrls: UploadUrl[] } =
    await res.json();

  // Step 2: upload each file directly to GCS via the signed PUT URL.
  await Promise.all(
    uploadUrls.map(({ index, fileType, signedUrl }) => {
      const srcFile = fileType === "mp3" ? mp3s[index] : pdfs[index];
      return fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type":
            srcFile.type ||
            (fileType === "mp3" ? "audio/mpeg" : "application/pdf"),
        },
        body: srcFile,
      }).then((r) => {
        if (!r.ok)
          throw new Error(
            `GCS upload failed for ${fileType}[${index}]: ${r.status}`,
          );
      });
    }),
  );

  return { jobId };
}

export async function startJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/jobs/${id}/start`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`startJob failed: ${res.status}`);
}

export async function pollJob(id: string): Promise<Lecture> {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`pollJob failed: ${res.status}`);
  const job: ApiJob = await res.json();
  return toLecture(job);
}

export async function updateTopicDisplayName(
  fach: string,
  displayName: string | undefined,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/topics/${encodeURIComponent(fach)}`,
    {
      method: "PATCH",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName ?? null }),
    },
  );
  if (!res.ok) throw new Error(`updateTopicDisplayName failed: ${res.status}`);
}

export async function fetchIntermediates(
  jobId: string,
): Promise<{ name: string; url: string }[]> {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/intermediates`, {
    headers: await authHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}
