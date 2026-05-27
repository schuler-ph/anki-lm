terraform {
  required_version = ">= 1.7"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

# ── SSH key ───────────────────────────────────────────────────────────────────

resource "hcloud_ssh_key" "main" {
  name       = "ankilm-key"
  public_key = var.ssh_public_key
}

# ── Firewall ──────────────────────────────────────────────────────────────────

resource "hcloud_firewall" "ankilm" {
  name = "ankilm"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
  # Dify API port (direct access, no HTTPS — only open if you don't use a domain + Caddy)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "5001"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

# ── Persistent volume for Dify data ──────────────────────────────────────────

resource "hcloud_volume" "dify_data" {
  name      = "ankilm-dify-data"
  size      = 20
  location  = var.location
  format    = "ext4"
}

# ── VPS ───────────────────────────────────────────────────────────────────────

resource "hcloud_server" "ankilm" {
  name        = "ankilm"
  image       = "ubuntu-24.04"
  server_type = "cax21"   # 4 vCPU ARM, 8 GB RAM — enough for Dify stack
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.main.id]
  firewall_ids = [hcloud_firewall.ankilm.id]

  user_data = templatefile("${path.module}/cloud-init.yaml.tpl", {
    dify_domain = var.dify_domain
  })
}

resource "hcloud_volume_attachment" "dify_data" {
  volume_id = hcloud_volume.dify_data.id
  server_id = hcloud_server.ankilm.id
  automount = true
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "server_ip" {
  description = "Public IP of the Hetzner VPS — point your DNS A record here"
  value       = hcloud_server.ankilm.ipv4_address
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh root@${hcloud_server.ankilm.ipv4_address}"
}
