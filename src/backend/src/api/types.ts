export type JobStatus = "preparing" | "processing" | "processed" | "failed";

export interface Job {
  id: string;
  fach: string;
  lectureName: string;
  status: JobStatus;
  outputFiles: Record<string, string>;
  createdAt: number;
  mp3GcsPath?: string;
  pdfGcsPath?: string;
  error?: string;
}
