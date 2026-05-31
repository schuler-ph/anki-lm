export type JobStatus = "preparing" | "processing" | "processed" | "failed";

export type Lecture = {
  id: string;
  fach: string;
  title: string;
  status: JobStatus;
  outputFiles: Record<string, string>;
  createdAt: number;
  mp3GcsPath?: string;
  pdfGcsPath?: string;
  error?: string;
};

export type Topic = {
  fach: string;
  lectures: Lecture[];
};
