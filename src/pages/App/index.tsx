import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

import BaseKnowledge from "../../components/Demo/BaseKnowledge";
import Lectures from "../../components/Demo/Lectures";
import { BrandingIntro } from "../../components/Demo/BrandingIntro";
import { fetchJobs } from "../../components/Demo/api";
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
  return [...map.entries()].map(([fach, ls]) => ({ fach, lectures: ls }));
}

function App() {
  const { user, loading, signIn } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentFach, setCurrentFach] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const handleIntroComplete = useCallback(() => setShowIntro(false), []);
  const [addingTopic, setAddingTopic] = useState(false);
  const [newFach, setNewFach] = useState("");
  const newFachInputRef = useRef<HTMLInputElement>(null);

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
    if (addingTopic) newFachInputRef.current?.focus();
  }, [addingTopic]);

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
    setTopics((prev) =>
      prev.some((t) => t.fach === name) ? prev : [...prev, { fach: name, lectures: [] }]
    );
    setCurrentFach(name);
    setNewFach("");
    setAddingTopic(false);
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
        className={`grid grid-cols-12 min-h-screen ${
          showIntro ? "overflow-hidden h-screen" : ""
        }`}
      >
        <aside className="flex flex-col col-span-3 border-r border-gray-200 bg-white">
          <h2 className="font-bold border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider p-4 pl-10 pb-2">
            Themen
          </h2>
          <div className="pl-6 flex flex-col">
            {topics.length === 0 && !addingTopic && (
              <p className="text-sm text-gray-400 italic px-4 py-3">
                Noch keine Themen. Füge ein neues Thema hinzu.
              </p>
            )}
            {topics.map((topic) => (
              <button
                key={topic.fach}
                className={"py-3 px-4 cursor-pointer text-left hover:bg-indigo-50 transition-colors border-l-4 " +
                  (currentFach === topic.fach
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-medium"
                    : "border-transparent text-gray-600")}
                onClick={() => setCurrentFach(topic.fach)}
              >
                {topic.fach}
              </button>
            ))}

            {addingTopic
              ? (
                <form onSubmit={handleAddTopic} className="mt-2 mx-4 flex gap-1">
                  <input
                    ref={newFachInputRef}
                    type="text"
                    value={newFach}
                    onChange={(e) => setNewFach(e.target.value)}
                    placeholder="Themenname"
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                  className="mt-2 mx-4 py-2 px-4 border border-dashed border-gray-300 rounded text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm"
                >
                  + Neues Thema
                </button>
              )}
          </div>
        </aside>

        <article className="col-span-9">
          {currentTopic
            ? (
              <>
                <header className="bg-white border-b border-gray-200 px-8 py-6 pr-6">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {currentTopic.fach}
                  </h1>
                </header>
                <div className="px-8 py-8 space-y-8">
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
