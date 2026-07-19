#!/usr/bin/env bash
# Point this machine at Oracle Cloud Doorli (Docker + live apps).
# Usage: source scripts/use-oci.sh   OR   bash scripts/use-oci.sh
set -euo pipefail

OCI_HOST="${OCI_HOST:-140.245.207.93}"
OCI_USER="${OCI_USER:-opc}"
SSH_KEY="${DOORLI_OCI_SSH_KEY:-$HOME/Downloads/ssh-key-2026-07-17.key}"

if [ ! -f "$SSH_KEY" ]; then
  echo "SSH key not found: $SSH_KEY"
  echo "Set DOORLI_OCI_SSH_KEY to your OCI private key path."
  exit 1
fi

# Ensure SSH config host exists for Docker context
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
if ! grep -q "Host doorli-oci" "$HOME/.ssh/config" 2>/dev/null; then
  cat >> "$HOME/.ssh/config" <<CFG

Host doorli-oci 140.245.207.93
  HostName ${OCI_HOST}
  User ${OCI_USER}
  IdentityFile ${SSH_KEY}
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
  ServerAliveInterval 30
CFG
  chmod 600 "$HOME/.ssh/config"
fi

# Docker CLI talks to OCI over SSH (no Docker Desktop needed)
if ! docker context inspect oci >/dev/null 2>&1; then
  docker context create oci --docker "host=ssh://doorli-oci" --description "Oracle Cloud Doorli"
fi
docker context use oci >/dev/null

export DOCKER_CONTEXT=oci
export OCI_PUBLIC_URL="http://${OCI_HOST}"
export NEXT_PUBLIC_API_URL="http://${OCI_HOST}"
export EXPO_PUBLIC_API_URL="http://${OCI_HOST}"

echo "Docker context: $(docker context show)"
echo "Live URLs:"
echo "  API health : ${OCI_PUBLIC_URL}/health"
echo "  Customer   : ${OCI_PUBLIC_URL}/"
echo "  Vendor     : ${OCI_PUBLIC_URL}/vendor"
echo "  Admin      : ${OCI_PUBLIC_URL}/admin"
echo "  ERP        : ${OCI_PUBLIC_URL}/erp/login"
echo "  ERP admin  : ${OCI_PUBLIC_URL}/erp/sys-control/login"
echo
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -20
