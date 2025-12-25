function PdfSection({ lecture }: { lecture: { pdf: string[] } }) {
  return (
    <div className="mt-4">
      <h4 className="font-semibold">II.2: PDF Dateien</h4>
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
  );
}

export default PdfSection;
