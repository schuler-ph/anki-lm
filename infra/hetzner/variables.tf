variable "hcloud_token" {
  description = "Hetzner Cloud API token (generate at console.hetzner.cloud → Security → API Tokens)"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key content (e.g. content of ~/.ssh/id_ed25519.pub)"
  type        = string
}

variable "location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "fsn1"  # Falkenstein, Germany
}

variable "dify_domain" {
  description = "Domain for Dify (e.g. dify.yourdomain.com). Leave empty to use raw IP."
  type        = string
  default     = ""
}
