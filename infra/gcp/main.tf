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
    "firestore.googleapis.com",
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

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT"]
    response_header = ["Content-Type", "ETag"]
    max_age_seconds = 3600
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

  cleanup_policy_dry_run = false
  cleanup_policies {
    id     = "keep-1"
    action = "KEEP"
    most_recent_versions {
      keep_count = 1
    }
  }
}

resource "google_artifact_registry_repository_iam_member" "backend_ar_writer" {
  repository = google_artifact_registry_repository.ankilm.name
  location   = var.region
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.ankilm_backend.email}"
}

resource "google_project_iam_member" "backend_run_developer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.ankilm_backend.email}"
}

resource "google_service_account_iam_member" "backend_act_as_self" {
  service_account_id = google_service_account.ankilm_backend.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ankilm_backend.email}"
}

resource "google_project_iam_member" "backend_token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.ankilm_backend.email}"
}

# ── Firestore database ────────────────────────────────────────────────────────

resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  depends_on  = [google_project_service.apis]
}

resource "google_project_iam_member" "backend_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.ankilm_backend.email}"
}

# ── Cloud Run API service ─────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "backend_api" {
  name     = "ankilm-backend-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.ankilm_backend.email

    timeout = "3600s"

    containers {
      image = "gcr.io/cloudrun/hello:latest"
      # Replaced by GitHub Action on first real deploy; placeholder avoids "image not found" on initial terraform apply.

      ports {
        container_port = 8080
      }

      env {
        name  = "GCS_BUCKET"
        value = var.bucket_name
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      # OPENAI_API_KEY, DIFY_API_KEY, DIFY_API_URL, FILE_ACCEPTOR_SECRET
      # are injected at deploy time via --update-env-vars in the GitHub Action.
      env {
        name  = "OPENAI_API_KEY"
        value = "placeholder-set-at-deploy"
      }
      env {
        name  = "DIFY_API_KEY"
        value = "placeholder-set-at-deploy"
      }
      env {
        name  = "DIFY_API_URL"
        value = "placeholder-set-at-deploy"
      }
      env {
        name  = "FILE_ACCEPTOR_SECRET"
        value = "placeholder-set-at-deploy"
      }
    }
  }

  depends_on = [google_project_service.apis]

  lifecycle {
    # The GitHub Action updates the image and env vars at deploy time;
    # prevent terraform apply from reverting those changes.
    ignore_changes = [template]
  }
}

resource "google_cloud_run_v2_service_iam_member" "backend_api_allow_unauthenticated" {
  name     = google_cloud_run_v2_service.backend_api.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "backend_api_url" {
  description = "Cloud Run backend API URL"
  value       = google_cloud_run_v2_service.backend_api.uri
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
