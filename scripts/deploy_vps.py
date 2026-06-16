#!/usr/bin/env python3
"""Deploy DrapeSoul to VPS via SSH."""
import os
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

VPS_IP = os.environ.get("VPS_IP", "77.83.206.179")
VPS_USER = os.environ.get("VPS_USER", "root")
VPS_PORT = int(os.environ.get("VPS_PORT", "22"))
VPS_PASS = os.environ.get("VPS_PASS", "")

ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {
    "node_modules", ".venv", "pgdata", "tools", "miniconda3",
    ".local-logs", ".local-pids", ".git", "dist", "__pycache__",
}
EXCLUDE_FILES = {".env.example"}


def run_ssh(client: paramiko.SSHClient, cmd: str, timeout: int = 600) -> tuple[int, str, str]:
    print(f"  $ {cmd[:120]}{'...' if len(cmd) > 120 else ''}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out[-2000:] if len(out) > 2000 else out)
    if err.strip() and code != 0:
        print(err[-1000:], file=sys.stderr)
    return code, out, err


def create_archive() -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    print("==> Creating project archive...")
    with tarfile.open(tmp_path, "w:gz") as tar:
        for item in ROOT.rglob("*"):
            rel = item.relative_to(ROOT)
            parts = set(rel.parts)
            if parts & EXCLUDE_DIRS:
                continue
            if any(p in EXCLUDE_DIRS for p in rel.parts):
                continue
            if rel.name in EXCLUDE_FILES:
                continue
            if "node_modules" in rel.parts or ".venv" in rel.parts:
                continue
            if rel.match("backend/static/uploads/products/*") and rel.name != ".gitkeep":
                continue
            tar.add(item, arcname=str(rel))
    print(f"    Archive size: {tmp_path.stat().st_size / 1024 / 1024:.1f} MB")
    return tmp_path


def main():
    if not VPS_PASS:
        print("ERROR: Set VPS_PASS environment variable")
        sys.exit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"==> Connecting to {VPS_USER}@{VPS_IP}:{VPS_PORT}...")
    client.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)

    print("==> Running VPS init (wipe + swap + docker)...")
    init_script = (ROOT / "scripts" / "vps-init.sh").read_text()
    code, _, _ = run_ssh(client, f"bash -s << 'INIT_EOF'\n{init_script}\nINIT_EOF", timeout=300)
    if code != 0:
        print("WARN: vps-init returned non-zero, continuing...")

    archive = create_archive()
    remote_tar = "/tmp/drapesoul-deploy.tar.gz"
    print("==> Uploading archive...")
    sftp = client.open_sftp()
    sftp.put(str(archive), remote_tar)
    sftp.close()
    archive.unlink()

    print("==> Extracting to /opt/drapesoul...")
    run_ssh(client, "mkdir -p /opt/drapesoul && rm -rf /opt/drapesoul/* /opt/drapesoul/.[!.]* 2>/dev/null; true")
    run_ssh(client, f"tar -xzf {remote_tar} -C /opt/drapesoul && rm -f {remote_tar}")
    run_ssh(client, "chmod +x /opt/drapesoul/scripts/*.sh")

    print("==> Building Docker images sequentially (1GB RAM)...")
    for service in ["backend", "frontend", "telegram-bot"]:
        print(f"    Building {service}...")
        code, _, _ = run_ssh(
            client,
            f"cd /opt/drapesoul && COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose build {service} 2>&1",
            timeout=1800,
        )
        if code != 0:
            print(f"ERROR: Docker build failed for {service}")
            sys.exit(1)

    print("==> Starting containers...")
    run_ssh(client, "cd /opt/drapesoul && docker compose up -d", timeout=300)

    print("==> Seeding database if empty...")
    run_ssh(
        client,
        "cd /opt/drapesoul && docker compose exec -T backend sh -c 'PYTHONPATH=. python scripts/seed_data.py' 2>/dev/null || true",
        timeout=120,
    )

    print("==> Waiting for backend health...")
    for i in range(36):
        code, out, _ = run_ssh(
            client,
            "docker compose -f /opt/drapesoul/docker-compose.yml exec -T backend curl -sf http://localhost:8000/api/health 2>/dev/null || echo fail",
            timeout=30,
        )
        if "healthy" in out:
            print("    Backend is healthy!")
            break
        import time
        time.sleep(5)
    else:
        print("WARN: Health check timed out")

    run_ssh(client, "cd /opt/drapesoul && docker compose ps && free -h")
    client.close()

    print("\n========================================")
    print("  DEPLOYMENT COMPLETE")
    print("  Shop:  https://drapesoul.uz")
    print("  Admin: https://admin.drapesoul.uz/admin/login")
    print("  API:   https://api.drapesoul.uz/api/health")
    print("========================================")


if __name__ == "__main__":
    main()
