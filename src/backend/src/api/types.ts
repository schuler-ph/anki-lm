export type JobStatus = "preparing" | "processing" | "processed" | "failed";

export interface Job {
  id: string;
  userId: string;
  fach: string;
  lectureName: string;
  status: JobStatus;
  outputFiles: Record<string, string>;
  createdAt: number;
  mp3GcsPaths: string[];
  pdfGcsPaths: string[];
  mp3OriginalNames: string[];
  pdfOriginalNames: string[];
  fachDisplayName?: string;
  error?: string;
}
