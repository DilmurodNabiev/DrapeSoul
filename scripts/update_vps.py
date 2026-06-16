#!/usr/bin/env python3
"""Update DrapeSoul on VPS (no wipe — keeps database & uploads)."""
import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
VPS_IP = os.environ.get("VPS_IP", "77.83.206.179")
VPS_USER = os.environ.get("VPS_USER", "root")
VPS_PASS = os.environ.get("VPS_PASS", "")
EXCLUDE = {"node_modules", ".venv", "pgdata", "tools", "miniconda3", ".local-logs", ".local-pids", ".git", "dist", "__pycache__"}


def run_ssh(client, cmd, timeout=1800):
    print(f"  $ {cmd[:100]}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    text = (out + err).strip()
    if text:
        print(text[-2000:])
    return code


def upload_project(client):
    tmp = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    print("==> Packaging project...")
    with tarfile.open(tmp_path, "w:gz") as tar:
        for item in ROOT.rglob("*"):
            rel = item.relative_to(ROOT)
            if any(p in EXCLUDE for p in rel.parts):
                continue
            if rel.match("backend/static/uploads/products/*") and rel.name != ".gitkeep":
                continue
            tar.add(item, arcname=str(rel))
    print(f"    Size: {tmp_path.stat().st_size / 1024 / 1024:.1f} MB")
    sftp = client.open_sftp()
    sftp.put(str(tmp_path), "/tmp/drapesoul-update.tar.gz")
    sftp.close()
    tmp_path.unlink()
    run_ssh(client, "tar -xzf /tmp/drapesoul-update.tar.gz -C /opt/drapesoul && rm -f /tmp/drapesoul-update.tar.gz")
    run_ssh(client, "chmod +x /opt/drapesoul/scripts/*.sh")


def main():
    if not VPS_PASS:
        print("Usage: VPS_PASS='yourpassword' python scripts/update_vps.py")
        sys.exit(1)

    services = sys.argv[1:] if len(sys.argv) > 1 else ["backend", "frontend", "telegram-bot"]

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"==> Connecting to {VPS_USER}@{VPS_IP}...")
    client.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)

    upload_project(client)

    for svc in services:
        print(f"==> Rebuilding {svc}...")
        if run_ssh(client, f"cd /opt/drapesoul && docker compose build {svc}") != 0:
            sys.exit(1)

    print("==> Restarting updated services...")
    svc_list = " ".join(services)
    run_ssh(client, f"cd /opt/drapesoul && docker compose up -d --no-deps {svc_list}")
    # Always restart nginx so upstream IPs refresh after container recreate
    run_ssh(client, "cd /opt/drapesoul && docker compose restart nginx")

    run_ssh(client, "docker compose -f /opt/drapesoul/docker-compose.yml ps", timeout=30)
    client.close()
    print("\n==> Update complete! Database and products are preserved.")


if __name__ == "__main__":
    main()
