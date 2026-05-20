#!/usr/bin/env python3
"""
Network Inventory Diagnostics
Wczytuje inventory.yaml i wykonuje komendy diagnostyczne na kazdy urzadzeniu.
"""

import sys
import io
import argparse
import time
import re
from datetime import datetime
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

try:
    import yaml
except ImportError:
    print("[ERROR] Brak PyYAML. Zainstaluj: pip install pyyaml")
    sys.exit(1)

try:
    from netmiko import ConnectHandler
    from netmiko.exceptions import (
        NetmikoTimeoutException,
        NetmikoAuthenticationException,
    )
except ImportError:
    print("[ERROR] Brak Netmiko. Zainstaluj: pip install netmiko")
    sys.exit(1)


# ─── Komendy per vendor ──────────────────────────────────────────────────────

COMMANDS = {
    "cisco_ios": [
        "show log",
        "show interfaces status",
        "show version",
        "show ip interface brief",
    ],
    "stormshield": [
        "SYSTEM PROPERTY",
        "SYSTEM INFORMATION",
        "SYSTEM STATUS",
        "MONITOR HEALTH",
        "MONITOR INTERFACE",
        "MONITOR ROUTE",
        "MONITOR GETIKESA",
        "MONITOR CERT",
        "LOG INFO",
        "LOG DOWNLIMIT lines=100",
    ],
    "qnap": [
        "dmesg | tail -50",
        "df -h",
        "uptime",
        "cat /var/log/syslog | tail -100",
    ],
    "synology": [
        "dmesg | tail -50",
        "df -h",
        "uptime",
        "cat /var/log/messages | tail -100",
    ],
    "esxi": [
        "esxcli system version get",
        "esxcli system stats uptime get",
        "vim-cmd vmsvc/getallvms",
        "esxcli storage filesystem list",
        "cat /var/log/vmkernel.log | tail -100",
    ],
    "linux": [
        "uname -a",
        "uptime",
        "df -h",
    ],
}

# Netmiko device_type per vendor
NETMIKO_TYPE = {
    "cisco":       "cisco_ios",
    "cisco_ios":   "cisco_ios",
    "stormshield": "linux",
    "qnap":        "linux",
    "synology":    "linux",
    "esxi":        "linux",
    "linux":       "linux",
}


# ─── Helpery ─────────────────────────────────────────────────────────────────

def detect_vendor(device: dict) -> str:
    """Wykrywa vendor z pola 'vendor' lub na podstawie nazwy urzadzenia."""
    if "vendor" in device and device["vendor"]:
        return device["vendor"].lower()

    name = device.get("name", "").upper()
    dt   = device.get("device_type", "").lower()

    if dt == "cisco_ios":
        return "cisco_ios"

    if "ESXI" in name:
        return "esxi"
    if re.search(r"SN\d{3}|STORMSHIELD|FW-SN", name):
        return "stormshield"
    if "QNAP" in name:
        return "qnap"
    if "SYNOLOGY" in name:
        return "synology"

    return "linux"


def choose_password(vendor: str, args) -> str:
    if vendor in ("cisco", "cisco_ios"):
        return args.pass_cisco or ""
    if vendor == "esxi":
        return args.pass_esxi or ""
    if vendor == "stormshield":
        return args.pass_stormshield or ""
    return args.pass_linux or ""


def safe_filename(name: str) -> str:
    return re.sub(r'[\\/:*?"<>| ]', "_", name)


def divider(title: str = "", width: int = 60, char: str = "=") -> str:
    if title:
        return f"\n{char * width}\n  {title}\n{char * width}\n"
    return char * width


# ─── Raw SSH (paramiko) dla urzadzen z niestandardowym promptem ─────────────

def _shell_wait_for(shell, expected: str, timeout: int = 30) -> str:
    """Czeka az bufor zawiera oczekiwany string, zwraca caly zebrany output."""
    buf = b""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if shell.recv_ready():
            buf += shell.recv(65535)
            if expected.encode() in buf:
                break
        else:
            time.sleep(0.2)
    return buf.decode("utf-8", errors="replace")


def run_commands_stormshield(host: str, ssh_user: str, ssh_pass: str,
                             cli_pass: str, commands: list,
                             connect_timeout: int = 45) -> list:
    """
    Dwuetapowy login Stormshield:
      1. SSH jako ssh_user / ssh_pass
      2. Wysyla 'cli' → czeka na 'Enter password:' → wysyla cli_pass
      3. Czeka na prompt 'SRPClient>'
      4. Wykonuje komendy z expect 'SRPClient>'
    """
    import paramiko

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=ssh_user, password=ssh_pass,
                   timeout=connect_timeout, look_for_keys=False, allow_agent=False)

    shell = client.invoke_shell(width=220, height=50)
    time.sleep(2)
    if shell.recv_ready():
        shell.recv(65535)   # flush banner

    # Krok 1: wejdz w CLI
    shell.send("cli\n")
    _shell_wait_for(shell, "Enter password:", timeout=15)

    # Krok 2: podaj haslo CLI
    shell.send(cli_pass + "\n")
    _shell_wait_for(shell, "SRPClient>", timeout=15)

    # Krok 3: wykonuj komendy
    outputs = []
    for cmd in commands:
        shell.send(cmd + "\n")
        out = _shell_wait_for(shell, "SRPClient>", timeout=30)
        outputs.append(out)

    shell.send("quit\n")
    time.sleep(1)
    client.close()
    return outputs


def run_commands_raw_ssh(host: str, username: str, password: str,
                         commands: list, prompt_end: str = ">",
                         connect_timeout: int = 30, cmd_wait: float = 3.0) -> list:
    """Wykonuje komendy przez raw paramiko shell — dla ESXi itp."""
    import paramiko

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=username, password=password,
                   timeout=connect_timeout, look_for_keys=False, allow_agent=False)

    shell = client.invoke_shell(width=220, height=50)
    time.sleep(2)
    if shell.recv_ready():
        shell.recv(65535)   # flush banner

    outputs = []
    for cmd in commands:
        shell.send(cmd + "\n")
        time.sleep(cmd_wait)
        buf = b""
        deadline = time.time() + 30
        while time.time() < deadline:
            if shell.recv_ready():
                buf += shell.recv(65535)
                if buf.decode("utf-8", errors="replace").rstrip().endswith(prompt_end):
                    break
            else:
                time.sleep(0.3)
        outputs.append(buf.decode("utf-8", errors="replace"))

    client.close()
    return outputs


# ─── Polaczenie i wykonanie komend ──────────────────────────────────────────

def run_device(device: dict, vendor: str, password: str, report_dir: Path) -> dict:
    name     = device["name"]
    host     = device["host"]
    username = device.get("username", "")
    vendor_key = "cisco_ios" if vendor in ("cisco", "cisco_ios") else vendor
    commands = COMMANDS.get(vendor_key, COMMANDS["linux"])
    nm_type  = NETMIKO_TYPE[vendor]

    result = {
        "name":     name,
        "host":     host,
        "vendor":   vendor,
        "status":   "OK",
        "error":    "",
        "duration": 0.0,
    }

    t0 = time.time()

    conn_params = {
        "device_type":    nm_type,
        "host":           host,
        "username":       username,
        "password":       password,
        "timeout":        30,
        "banner_timeout": 20,
        "fast_cli":       False,
    }

    # ESXi i Stormshield moga wymagac dluzszego czasu i wylaczonego strict prompt
    if vendor in ("esxi", "stormshield"):
        conn_params["timeout"] = 45

    lines = []
    lines.append(divider(f"DEVICE: {name}  [{host}]  vendor: {vendor}"))
    lines.append(f"Timestamp : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    try:
        # Stormshield: dwuetapowy login SSH → cli → SRPClient>
        if vendor == "stormshield":
            outputs = run_commands_stormshield(
                host=host,
                ssh_user=username,
                ssh_pass=password,
                cli_pass=device.get("_cli_pass", password),
                commands=commands,
                connect_timeout=45,
            )
            for cmd, out in zip(commands, outputs):
                lines.append(divider(f"CMD: {cmd}", char="-"))
                lines.append(out)

        else:
            conn = ConnectHandler(**conn_params)

            for cmd in commands:
                lines.append(divider(f"CMD: {cmd}", char="-"))
                try:
                    if vendor in ("esxi", "qnap", "synology", "linux"):
                        out = conn.send_command_timing(
                            cmd,
                            delay_factor=3,
                            max_loops=500,
                            strip_prompt=False,
                            strip_command=False,
                        )
                    else:
                        out = conn.send_command(
                            cmd,
                            read_timeout=60,
                            expect_string=r"#",
                        )
                    lines.append(out)
                except Exception as e:
                    lines.append(f"[CMD ERROR] {cmd}: {e}")

            conn.disconnect()

    except NetmikoAuthenticationException:
        result["status"] = "AUTH_ERROR"
        result["error"]  = "Bledna autoryzacja (username/password)"
        lines.append(f"\n[AUTH ERROR] Bledna autoryzacja")

    except NetmikoTimeoutException:
        result["status"] = "TIMEOUT"
        result["error"]  = f"Timeout polaczenia SSH do {host}"
        lines.append(f"\n[TIMEOUT] Nie mozna polaczyc sie z {host}")

    except Exception as e:
        result["status"] = "ERROR"
        result["error"]  = str(e)
        lines.append(f"\n[ERROR] {e}")

    result["duration"] = round(time.time() - t0, 1)
    lines.append(f"\n{divider()}")
    lines.append(f"Czas wykonania: {result['duration']}s  |  Status: {result['status']}")

    # Zapis do pliku raportu
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    fname = safe_filename(name)
    report_path = report_dir / f"{fname}_{ts}.txt"
    report_path.write_text("\n".join(lines), encoding="utf-8", errors="replace")
    result["report"] = str(report_path)

    return result


# ─── Glowna petla ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Network Inventory Diagnostics")
    parser.add_argument("--inventory",        default="inventory.yaml", help="Sciezka do inventory.yaml")
    parser.add_argument("--pass-cisco",       default="",  help="Haslo do urzadzen Cisco IOS")
    parser.add_argument("--pass-linux",       default="",  help="Haslo do urzadzen Linux (QNAP, Synology, inne)")
    parser.add_argument("--pass-stormshield",     default="",  help="Haslo SSH do Stormshield")
    parser.add_argument("--pass-stormshield-cli", default="",  help="Haslo CLI Stormshield (po 'Enter password:')")
    parser.add_argument("--pass-esxi",        default="",  help="Haslo do serwerow ESXi")
    parser.add_argument("--reports-dir",      default="reports", help="Folder na raporty (domyslnie: ./reports)")
    parser.add_argument("--filter",           default="",  help="Filtruj urzadzenia po nazwie (substring, case-insensitive)")
    args = parser.parse_args()

    # Wczytaj inventory
    inv_path = Path(args.inventory)
    if not inv_path.exists():
        print(f"[ERROR] Nie znaleziono pliku: {inv_path}")
        sys.exit(1)

    with inv_path.open(encoding="utf-8") as f:
        inventory = yaml.safe_load(f)

    devices = inventory.get("devices", [])
    if not devices:
        print("[ERROR] Brak urzadzen w inventory.yaml")
        sys.exit(1)

    # Filtrowanie
    if args.filter:
        devices = [d for d in devices if args.filter.lower() in d.get("name", "").lower()]
        print(f"[*] Filtr '{args.filter}': {len(devices)} urzadzen\n")

    # Folder raportow
    report_dir = Path(args.reports_dir)
    report_dir.mkdir(exist_ok=True)

    total = len(devices)
    print(divider(f"NET AUDIT  |  {total} urzadzen  |  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"))
    print()

    results = []
    session_ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    for i, device in enumerate(devices, 1):
        name   = device.get("name", f"device_{i}")
        host   = device.get("host", "")
        vendor = detect_vendor(device)
        pw     = choose_password(vendor, args)

        print(f"[{i:>2}/{total}] {name:<40} {host:<18} vendor={vendor} ...", end=" ", flush=True)

        if not host:
            print("SKIP (brak hosta)")
            results.append({"name": name, "host": "", "vendor": vendor,
                             "status": "SKIP", "error": "brak hosta", "duration": 0.0})
            continue

        if not pw:
            print("SKIP (brak hasla dla tego typu)")
            results.append({"name": name, "host": host, "vendor": vendor,
                             "status": "SKIP", "error": "nie podano hasla", "duration": 0.0})
            continue

        if vendor == "stormshield":
            device["_cli_pass"] = args.pass_stormshield_cli or pw
        res = run_device(device, vendor, pw, report_dir)
        results.append(res)
        print(f"{res['status']:<12} ({res['duration']}s)")

    # ─── Podsumowanie ────────────────────────────────────────────────────────
    print()
    print(divider("PODSUMOWANIE"))

    ok       = [r for r in results if r["status"] == "OK"]
    errors   = [r for r in results if r["status"] not in ("OK", "SKIP")]
    skipped  = [r for r in results if r["status"] == "SKIP"]

    print(f"\n  Urzadzen lacznie : {total}")
    print(f"  OK               : {len(ok)}")
    print(f"  Bledy            : {len(errors)}")
    print(f"  Pominiete        : {len(skipped)}")
    print()

    if ok:
        print("  [OK]")
        for r in ok:
            print(f"    {r['name']:<40} {r['host']:<18} {r['duration']}s")

    if errors:
        print("\n  [BLEDY]")
        for r in errors:
            print(f"    {r['name']:<40} {r['host']:<18} {r['status']}: {r['error']}")

    if skipped:
        print("\n  [POMINIETE]")
        for r in skipped:
            print(f"    {r['name']:<40} {r['error']}")

    # Zapisz zbiorcze podsumowanie
    summary_path = report_dir / f"_summary_{session_ts}.txt"
    with summary_path.open("w", encoding="utf-8") as f:
        f.write(f"NET AUDIT SUMMARY  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 60 + "\n\n")
        for r in results:
            line = f"{r['name']:<40} {r.get('host',''):<18} {r['vendor']:<12} {r['status']}"
            if r.get("duration"):
                line += f"  ({r['duration']}s)"
            if r.get("error"):
                line += f"  >> {r['error']}"
            f.write(line + "\n")

    print(f"\n  Raporty zapisane w: {report_dir.resolve()}")
    print(f"  Podsumowanie:       {summary_path.name}")
    print()


if __name__ == "__main__":
    main()
