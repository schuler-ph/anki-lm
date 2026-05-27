#cloud-config
package_update: true
packages:
  - docker.io
  - docker-compose-plugin
  - curl
  - git

runcmd:
  - systemctl enable docker
  - systemctl start docker
  - usermod -aG docker root
  - mkdir -p /opt/ankilm
  - echo "VPS ready. Deploy Dify by running: bash /opt/ankilm/deploy.sh"
