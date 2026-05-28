terraform {
  required_version = ">= 1.7"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Enable required APIs ───────────────────────────────────────────────────────

resource "google_project_service" "apis" {
  for_each = toset([
    "storage.googleapis.com",
    "iam.googleapis.com",
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "iamcredentials.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

# ── GCS bucket for lecture files ──────────────────────────────────────────────

resource "google_storage_bucket" "ankilm_files" {
  name                        = var.bucket_name
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false
  depends_on                  = [google_project_service.apis]

  lifecycle_rule {
    condition { age = 365 }
    action { type = "Delete" }
  }
}

# ── Service account for the backend orchestrator ──────────────────────────────

resource "google_service_account" "ankilm_backend" {
  account_id   = "ankilm-backend"
  display_name = "AnkiLM backend orchestrator"
  depends_on   = [google_project_service.apis]
}

resource "google_storage_bucket_iam_member" "backend_object_admin" {
  bucket = google_storage_bucket.ankilm_files.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.ankilm_backend.email}"
}

resource "google_service_account_key" "ankilm_backend_key" {
  service_account_id = google_service_account.ankilm_backend.name
}

# ── Artifact Registry for Cloud Run image ─────────────────────────────────────

resource "google_artifact_registry_repository" "ankilm" {
  repository_id = "ankilm"
  format        = "DOCKER"
  location      = var.region
  depends_on    = [google_project_service.apis]
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "gcs_bucket_name" {
  description = "GCS bucket name — set as GCS_BUCKET in backend .env"
  value       = google_storage_bucket.ankilm_files.name
}

output "backend_sa_key_base64" {
  description = "Base64-encoded service account JSON key — save as GOOGLE_APPLICATION_CREDENTIALS content"
  value       = google_service_account_key.ankilm_backend_key.private_key
  sensitive   = true
}
