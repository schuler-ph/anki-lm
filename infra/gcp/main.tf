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

# ── Cloud Run: file-acceptor service ──────────────────────────────────────────
# Accepts POST /?fileName=<path> (writes to GCS) and GET /<path> (reads from GCS).
# Used by Dify workflow nodes to save output files.

resource "google_cloud_run_v2_service" "file_acceptor" {
  name     = "ankilm-file-acceptor"
  location = var.region

  template {
    service_account = google_service_account.ankilm_backend.email

    containers {
      # Placeholder image for initial deploy — replaced by CI on first push to master
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.ankilm_files.name
      }
      env {
        name  = "FILE_ACCEPTOR_SECRET"
        value = var.file_acceptor_secret
      }
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# Allow unauthenticated invocations (auth handled by FILE_ACCEPTOR_SECRET header)
resource "google_cloud_run_v2_service_iam_member" "file_acceptor_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.file_acceptor.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "file_acceptor_url" {
  description = "Cloud Run file-acceptor URL — set as FILE_ACCEPTOR_URL in backend .env and Dify environment"
  value       = google_cloud_run_v2_service.file_acceptor.uri
}

output "gcs_bucket_name" {
  description = "GCS bucket name — set as GCS_BUCKET in backend .env"
  value       = google_storage_bucket.ankilm_files.name
}

output "backend_sa_key_base64" {
  description = "Base64-encoded service account JSON key — save as GOOGLE_APPLICATION_CREDENTIALS content"
  value       = google_service_account_key.ankilm_backend_key.private_key
  sensitive   = true
}
