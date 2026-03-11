import Path from "node:path";

export async function stampPdfWithSlideNumber(path: string, outputFolder: string) {
  const outputPdfPath = Path.join(
    outputFolder,
    `${Path.basename(path, ".pdf")}_numbered.pdf`,
  );

  console.log(`Adding page numbers to ${path}...`);

  const command = new Deno.Command("pdfcpu", {
    args: [
      "stamp",
      "add",
      "-mode",
      "text",
      "--",
      " Seite %p von %P ",
      "pos:tc, rot:0, scale:1.0 abs, points:10",
      path,
      outputPdfPath,
    ],
  });

  const { success, stderr } = await command.output();

  if (!success) {
    console.error(
      `Error processing ${path}: ${new TextDecoder().decode(stderr)}`,
    );
  } else {
    console.log(`Successfully created ${outputPdfPath}`);
  }
}
