import { useEffect, useRef, useState } from "react";
import Mp3Section from "./Mp3Section";
import PdfSection from "./PdfSection";
import ProcessSection from "./ProcessSection";
import StatusChip from "./StatusChip";
import { createJob, pollJob, startJob } from "./api";
import type { Lecture, Topic } from "./types";

const POLL_INTERVAL_MS = 3000;

function NewLectureForm({
  fach,
  onCreated,
}: {
  fach: string;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [mp3, setMp3] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mp3Ref = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mp3 || !pdf || !name.trim()) return;
    setUploading(true);
    setError(null);
    try {
      await createJob(mp3, pdf, fach, name.trim());
      onCreated();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 space-y-4"
    >
      <h4 className="font-bold text-gray-800 text-sm">Neue Vorlesung hinzufügen</h4>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Vorlesungsname
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. ArchitekturMuster"
          className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Audio (MP3)
          </p>
          <input
            ref={mp3Ref}
            type="file"
            accept=".mp3,audio/mpeg"
            className="hidden"
            onChange={(e) => setMp3(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => mp3Ref.current?.click()}
            className="w-full border border-dashed border-gray-300 rounded px-3 py-2 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-left"
          >
            {mp3 ? mp3.name : "+ Audio"}
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Folien (PDF)
          </p>
          <input
            ref={pdfRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => pdfRef.current?.click()}
            className="w-full border border-dashed border-gray-300 rounded px-3 py-2 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-left"
          >
            {pdf ? pdf.name : "+ PDF"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!mp3 || !pdf || !name.trim() || uploading}
        className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? "Wird hochgeladen..." : "Hochladen & Anlegen"}
      </button>
    </form>
  );
}

function LectureCard({
  lecture,
  onUpdate,
}: {
  lecture: Lecture;
  onUpdate: (updated: Lecture) => void;
}) {
  async function handleStart() {
    await startJob(lecture.id);
    onUpdate({ ...lecture, status: "processing" });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">{lecture.title}</h3>
        <StatusChip status={lecture.status} />
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Mp3Section lecture={lecture} />
          <PdfSection lecture={lecture} />
        </div>

        <div className="border-t border-gray-100" />

        <ProcessSection
          lecture={lecture}
          onStart={handleStart}
        />
      </div>
    </div>
  );
}

function Lectures({
  topic,
  onRefresh,
}: {
  topic: Topic;
  onRefresh: () => void;
}) {
  const [lectures, setLectures] = useState<Lecture[]>(topic.lectures);
  const [showForm, setShowForm] = useState(false);

  // Keep in sync when parent refreshes the topic.
  useEffect(() => {
    setLectures(topic.lectures);
  }, [topic]);

  // Poll all lectures that are currently processing.
  useEffect(() => {
    const processing = lectures.filter((l) => l.status === "processing");
    if (processing.length === 0) return;

    const timers = processing.map((l) =>
      setInterval(async () => {
        try {
          const updated = await pollJob(l.id);
          setLectures((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          if (updated.status === "processed" || updated.status === "failed") {
            clearInterval(timers.find((_, i) => processing[i].id === l.id));
          }
        } catch {
          // network hiccup — keep polling
        }
      }, POLL_INTERVAL_MS)
    );

    return () => timers.forEach(clearInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectures.map((l) => l.id + l.status).join(",")]);

  function updateLecture(updated: Lecture) {
    setLectures((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  async function handleCreated() {
    setShowForm(false);
    onRefresh();
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          Vorlesungen & Verarbeitung
        </h2>
        <p className="text-sm text-gray-500">
          Verwalten Sie hier Ihre Aufzeichnungen. Der Status zeigt an, ob
          Lernmaterialien bereits generiert wurden.
        </p>
      </div>

      <div className="space-y-8">
        {lectures.map((lecture) => (
          <LectureCard
            key={lecture.id}
            lecture={lecture}
            onUpdate={updateLecture}
          />
        ))}

        {showForm
          ? (
            <NewLectureForm
              fach={topic.fach}
              onCreated={handleCreated}
            />
          )
          : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm"
            >
              + Neue Vorlesung hinzufügen
            </button>
          )}
      </div>
    </section>
  );
}

export default Lectures;
