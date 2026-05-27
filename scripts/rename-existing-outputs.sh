#!/usr/bin/env bash
# Renames existing output files in all from_dify folders to the new naming convention.
# Old:  01-summary.md
# New:  EAI_ArchitekturMuster_01-summary.md
#
# Usage: LECTURE_ROOT=/path/to/lectures bash scripts/rename-existing-outputs.sh [--dry-run]
#
# Set LECTURE_ROOT or export it beforehand.

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "[dry-run] No files will be renamed."
fi

if [[ -z "${LECTURE_ROOT:-}" ]]; then
  echo "Error: LECTURE_ROOT is not set." >&2
  exit 1
fi

SUFFIXES=(
  "01-summary.md"
  "02-veredelt.md"
  "03-tldr.md"
  "04-konzepte.md"
  "05-beispiele.md"
  "06-anki.md"
)

# Walk <LECTURE_ROOT>/<fach>/lec/<date_name>/from_dify/
for fach_dir in "$LECTURE_ROOT"/*/; do
  fach=$(basename "$fach_dir")
  lec_dir="$fach_dir/lec"
  [[ -d "$lec_dir" ]] || continue

  for lecture_dir in "$lec_dir"/*/; do
    from_dify="$lecture_dir/from_dify"
    [[ -d "$from_dify" ]] || continue

    folder_name=$(basename "$lecture_dir")
    # Strip leading YYYY-MM-DD_ date prefix
    lecture_name="${folder_name#[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]_}"
    prefix="${fach}_${lecture_name}"

    for suffix in "${SUFFIXES[@]}"; do
      old_file="$from_dify/$suffix"
      new_file="$from_dify/${prefix}_${suffix}"

      if [[ -f "$old_file" ]]; then
        if [[ -f "$new_file" ]]; then
          echo "[skip] Already exists: $new_file"
          continue
        fi
        echo "Rename: $old_file → $new_file"
        if [[ "$DRY_RUN" == false ]]; then
          mv "$old_file" "$new_file"
        fi
      fi
    done
  done
done

echo "Done."
