variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "europe-west3"
}

variable "bucket_name" {
  description = "GCS bucket name for lecture files"
  type        = string
  default     = "ankilm-files"
}

variable "file_acceptor_secret" {
  description = "Shared secret for file-acceptor authentication (also set in Dify as FILE_ACCEPTOR_SECRET)"
  type        = string
  sensitive   = true
}
