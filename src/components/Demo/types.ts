export type JobStatus = "preparing" | "processing" | "processed" | "failed";

export type Lecture = {
  id: string;
  fach: string;
  title: string;
  status: JobStatus;
  outputFiles: Record<string, string>;
  createdAt: number;
  mp3GcsPaths?: string[];
  pdfGcsPaths?: string[];
  mp3OriginalNames?: string[];
  pdfOriginalNames?: string[];
  fachDisplayName?: string;
  error?: string;
};

export type Topic = {
  fach: string;
  displayName?: string;
  lectures: Lecture[];
};
