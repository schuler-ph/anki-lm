export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  fach: string;
  lectureName: string;
  status: JobStatus;
  outputFiles: string[];
  createdAt: number;
  error?: string;
}
