function Lectures(
  { currentItem }: {
    currentItem: {
      lectures: {
        title: string;
        status: string;
        mp3: string[];
        pdf: string[];
      }[];
    };
  },
) {
  return (
    <>
      <h2 className="font-semibold pt-6">Vorlesungen</h2>
      {currentItem.lectures.map((lecture, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-sm p-4 my-4"
        >
          <h3 className="font-semibold">{lecture.title}</h3>

          <div className="mt-2">
            <h4 className="font-semibold">MP3 Dateien</h4>
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
                    className="text-indigo-400 underline"
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

          <div className="mt-4">
            <h4 className="font-semibold">PDF Dateien</h4>
            {lecture.pdf.length === 0
              ? (
                <p className="italic text-sm my-2">
                  Keine PDF Dateien hochgeladen.
                </p>
              )
              : lecture.pdf.map((file) => (
                <div
                  key={file}
                  className="flex justify-between items-center border border-gray-200 rounded-sm my-2 p-2"
                >
                  <a
                    href={"/dir-praxis/" + file}
                    className="text-indigo-400 underline"
                  >
                    {file}
                  </a>
                  <button className="rounded-sm bg-gray-300 px-2 py-1 cursor-pointer">
                    Entfernen
                  </button>
                </div>
              ))}
            <button className="rounded-sm bg-gray-300 px-2 py-1 cursor-pointer">
              PDF hinzufügen
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default Lectures;
