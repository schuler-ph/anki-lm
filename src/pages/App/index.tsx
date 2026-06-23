import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

import BaseKnowledge from "../../components/Demo/BaseKnowledge";
import Lectures from "../../components/Demo/Lectures";
import ExportMenu from "../../components/Demo/ExportMenu";
import { BrandingIntro } from "../../components/Demo/BrandingIntro";
import { fetchJobs, updateTopicDisplayName } from "../../components/Demo/api";
import type { Lecture, Topic } from "../../components/Demo/types";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";

function groupByFach(lectures: Lecture[]): Topic[] {
  const map = new Map<string, Lecture[]>();
  for (const l of lectures) {
    const list = map.get(l.fach) ?? [];
    list.push(l);
    map.set(l.fach, list);
  }
  return [...map.entries()].map(([fach, ls]) => ({
    fach,
    displayName: ls[0]?.fachDisplayName,
    lectures: ls,
  }));
}

function App() {
  const { user, loading, signIn } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentFach, setCurrentFach] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const handleIntroComplete = useCallback(() => setShowIntro(false), []);
  const [addingTopic, setAddingTopic] = useState(false);
  const [newFach, setNewFach] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const newFachInputRef = useRef<HTMLInputElement>(null);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [editDisplayNameValue, setEditDisplayNameValue] = useState("");
  const editDisplayNameRef = useRef<HTMLInputElement>(null);

  async function loadJobs() {
    const lectures = await fetchJobs();
    const grouped = groupByFach(lectures);
    setTopics(grouped);
    if (grouped.length > 0 && currentFach === null) {
      setCurrentFach(grouped[0].fach);
    }
  }

  useEffect(() => {
    if (user) loadJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setEditingDisplayName(false);
    setEditDisplayNameValue("");
  }, [currentFach]);

  useEffect(() => {
    if (addingTopic) newFachInputRef.current?.focus();
  }, [addingTopic]);

  useEffect(() => {
    if (editingDisplayName) editDisplayNameRef.current?.focus();
  }, [editingDisplayName]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-600 text-lg">Melde dich an, um AnkiLM zu nutzen.</p>
        <Button onClick={signIn} name="Mit Google anmelden" />
      </div>
    );
  }

  function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    const name = newFach.trim();
    if (!name) return;
    const display = newDisplayName.trim() || undefined;
    setTopics((prev) =>
      prev.some((t) => t.fach === name)
        ? prev
        : [...prev, { fach: name, displayName: display, lectures: [] }]
    );
    setCurrentFach(name);
    setNewFach("");
    setNewDisplayName("");
    setAddingTopic(false);
  }

  function handleStartEditDisplayName() {
    if (!currentTopic) return;
    setEditDisplayNameValue(currentTopic.displayName ?? "");
    setEditingDisplayName(true);
  }

  async function handleSaveDisplayName(e: React.FormEvent) {
    e.preventDefault();
    if (!currentFach) return;
    const val = editDisplayNameValue.trim() || undefined;
    await updateTopicDisplayName(currentFach, val);
    setTopics((prev) =>
      prev.map((t) => t.fach === currentFach ? { ...t, displayName: val } : t)
    );
    setEditingDisplayName(false);
  }

  async function handleRefresh() {
    const lectures = await fetchJobs();
    const grouped = groupByFach(lectures);
    setTopics((prev) => {
      const apiKeys = new Set(grouped.map((t) => t.fach));
      const localOnly = prev.filter((t) => !apiKeys.has(t.fach));
      return [...grouped, ...localOnly];
    });
  }

  const currentTopic = topics.find((t) => t.fach === currentFach) ?? null;

  return (
    <>
      <AnimatePresence>
        {showIntro && <BrandingIntro onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <div
        className={`flex flex-col md:grid md:grid-cols-12 min-h-screen ${
          showIntro ? "overflow-hidden h-screen" : ""
        }`}
      >
        <aside className="flex flex-col md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
          <h2 className="font-bold border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider p-4 pl-4 md:pl-10 pb-2">
            Themen
          </h2>
          <div className="px-2 md:pl-6 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
            {topics.length === 0 && !addingTopic && (
              <p className="text-sm text-gray-400 italic px-4 py-3 whitespace-nowrap md:whitespace-normal">
                Noch keine Themen. Füge ein neues Thema hinzu.
              </p>
            )}
            {topics.map((topic) => (
              <button
                key={topic.fach}
                className={"py-3 px-4 cursor-pointer text-left hover:bg-indigo-50 transition-colors shrink-0 whitespace-nowrap border-b-4 md:border-b-0 md:border-l-4 " +
                  (currentFach === topic.fach
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-medium"
                    : "border-transparent text-gray-600")}
                onClick={() => setCurrentFach(topic.fach)}
              >
                {topic.displayName ?? topic.fach}
              </button>
            ))}

            {addingTopic
              ? (
                <form onSubmit={handleAddTopic} className="mt-2 mx-4 flex flex-col gap-1 shrink-0 w-56 md:w-auto">
                  <input
                    ref={newFachInputRef}
                    type="text"
                    value={newFach}
                    onChange={(e) => setNewFach(e.target.value)}
                    placeholder="Kürzel (z.B. eai)"
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    onKeyDown={(e) => e.key === "Escape" && setAddingTopic(false)}
                  />
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Vollständiger Name (optional)"
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    onKeyDown={(e) => e.key === "Escape" && setAddingTopic(false)}
                  />
                  <button
                    type="submit"
                    disabled={!newFach.trim()}
                    className="px-2 py-1 bg-indigo-600 text-white text-sm rounded disabled:opacity-40"
                  >
                    OK
                  </button>
                </form>
              )
              : (
                <button
                  onClick={() => setAddingTopic(true)}
                  className="my-2 mx-4 py-2 px-4 border border-dashed border-gray-300 rounded text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm shrink-0 whitespace-nowrap self-center md:self-auto"
                >
                  + Neues Thema
                </button>
              )}
          </div>
        </aside>

        <article className="md:col-span-9">
          {currentTopic
            ? (
              <>
                <header className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-6 flex justify-between items-start gap-4 flex-wrap">
                  <div className="min-w-0">
                  {editingDisplayName
                    ? (
                      <form onSubmit={handleSaveDisplayName} className="flex items-center gap-2 flex-wrap">
                        <input
                          ref={editDisplayNameRef}
                          type="text"
                          value={editDisplayNameValue}
                          onChange={(e) => setEditDisplayNameValue(e.target.value)}
                          placeholder={currentTopic.fach}
                          className="text-2xl font-bold text-gray-800 border-b-2 border-indigo-400 bg-transparent outline-none min-w-0 flex-1 max-w-72"
                          onKeyDown={(e) => e.key === "Escape" && setEditingDisplayName(false)}
                        />
                        <button
                          type="submit"
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          Speichern
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDisplayName(false)}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                          Abbrechen
                        </button>
                      </form>
                    )
                    : (
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-800">
                          {currentTopic.displayName ?? currentTopic.fach}
                        </h1>
                        <button
                          onClick={handleStartEditDisplayName}
                          title="Namen bearbeiten"
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  <p className="text-xs text-gray-400 mt-1">Kürzel: <code>{currentTopic.fach}</code></p>
                  </div>
                  <ExportMenu fach={currentTopic.fach} />
                </header>
                <div className="px-4 sm:px-6 md:px-8 py-8 space-y-8">
                  <BaseKnowledge currentItem={{ knowledge: [] }} />
                  <Lectures topic={currentTopic} onRefresh={handleRefresh} />
                </div>
              </>
            )
            : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-lg">Wähle ein Thema oder erstelle ein neues.</p>
              </div>
            )}
        </article>
      </div>
    </>
  );
}

export default App;
