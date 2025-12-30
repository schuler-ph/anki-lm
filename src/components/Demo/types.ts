export type Content = {
  id: number;
  title: string;
  body: string;
  knowledge: string[];
  lectures: Lecture[];
};

export type Lecture = {
  lid: number;
  title: string;
  status: "preparing";
  mp3: string[];
  pdf: string[];
} | {
  lid: number;
  title: string;
  status: "processed";
  mp3: string[];
  transcriptions?: Transcription[];
  pdf: string[];
  numbered?: string[];
  results?: Results;
};

export type Transcription = {
  name: string;
  content: React.ComponentType<unknown>;
};

export type Results = {
  summary: React.ComponentType<unknown>;
  veredelt: React.ComponentType<unknown>;
  tldr: React.ComponentType<unknown>;
  konzepte: React.ComponentType<unknown>;
  beispiele: React.ComponentType<unknown>;
  anki: React.ComponentType<unknown>;
};
