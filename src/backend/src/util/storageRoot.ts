import { isAbsolute, join, normalize, relative, SEPARATOR } from "@std/path";

export const LECTURE_ROOT_ENV_VAR = "LECTURE_ROOT";

export function getLectureRoot(): string {
  const lectureRoot = Deno.env.get(LECTURE_ROOT_ENV_VAR)?.trim();
  if (!lectureRoot) {
    throw new Error(`${LECTURE_ROOT_ENV_VAR} is not set.`);
  }

  return normalize(lectureRoot);
}

export function resolveLecturePath(pathInput: string): string {
  const lectureRoot = getLectureRoot();
  const candidate = isAbsolute(pathInput)
    ? normalize(pathInput)
    : normalize(join(lectureRoot, pathInput));

  const relativePath = relative(lectureRoot, candidate);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${SEPARATOR}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`Path is outside ${LECTURE_ROOT_ENV_VAR}: ${pathInput}`);
  }

  return candidate;
}

export function toRelativeLecturePath(pathInput: string): string {
  const lectureRoot = getLectureRoot();
  const resolvedPath = resolveLecturePath(pathInput);
  const relativePath = relative(lectureRoot, resolvedPath);

  return relativePath.split(SEPARATOR).join("/");
}

export function toFileServerPath(pathInput: string): string {
  return toRelativeLecturePath(pathInput)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
