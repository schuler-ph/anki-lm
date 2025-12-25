function Mp3Section({ lecture }: { lecture: { mp3: string[] } }) {
  return (
    <>
      <div className="mt-2">
        <h4 className="font-semibold">II.1: MP3 Dateien</h4>
        {lecture.mp3.length === 0
          ? (
            <p className="italic text-sm my-2">
              Keine MP3 Dateien hochgeladen.
            </p>
          )
          : lecture.mp3.map((file) => (
            <div
              key={file}
              className="flex justify-between items-center border border-gray-200 rounded-sm my-2 p-2"
            >
              <a
                href={"/dir-praxis/" + file}
                className="text-indigo-600 underline"
              >
                {file}
              </a>
              <button className="rounded-sm bg-gray-300 px-2 py-1 cursor-pointer">
                Entfernen
              </button>
            </div>
          ))}
        <button className="rounded-sm bg-gray-300 px-2 py-1 cursor-pointer">
          MP3 hinzufügen
        </button>
      </div>
    </>
  );
}

export default Mp3Section;
