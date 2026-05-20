#!/usr/bin/env python3
"""
Cisco Catalyst 2960 - Log Analyzer via SSH (Netmiko)
"""

import sys
import io
import argparse
import re
from collections import defaultdict

# Force UTF-8 output na Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

try:
    from netmiko import ConnectHandler
    from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException
except ImportError:
    print("[BLAD] Netmiko nie jest zainstalowane.")
    print("Zainstaluj: pip install netmiko")
    sys.exit(1)


# ─── Wzorce do analizy logow ────────────────────────────────────────────────

PATTERNS = {
    "CRITICAL": [
        r"%.*-0-",
        r"%.*-1-",
        r"hardware.*error|error.*hardware",
        r"stack.*mismatch|mismatch.*stack",
        r"power.*fail|fail.*power",
        r"hardware failure",
        r"watchdog.*reset|reset.*watchdog",
    ],
    "ERROR": [
        r"%.*-2-",
        r"%.*-3-",
        r"\berror\b",
        r"err_disabled",
        r"duplex.*mismatch|mismatch.*duplex",
        r"spanning.tree.*topology.*change",
        r"mac.*flap|flap.*mac",
        r"loop.*detected|bpduguard",
        r"storm.control",
        r"authentication.*fail|fail.*authentication",
        r"port.*security.*violation",
        r"temperature.*critical|critical.*temperature",
    ],
    "WARNING": [
        r"%.*-4-",
        r"\bwarn\b|\bwarning\b",
        r"stp.*topology|topology.*change",
        r"link.*down|down.*link",
        r"interface.*down",
        r"native.*vlan.*mismatch",
        r"cdp.*native.*vlan",
        r"cpu.*utilization",
        r"memory.*low|low.*memory",
        r"config.*changed|changed.*config",
        r"snmp.*trap",
    ],
    "INFO": [
        r"%.*-5-",
        r"%.*-6-",
        r"link.*up",
        r"interface.*up",
        r"neighbor.*added|neighbor.*removed",
        r"vlan.*created|vlan.*removed",
        r"config.*save|write.*mem",
    ],
}

COMPILED = {
    sev: [re.compile(p, re.IGNORECASE) for p in pats]
    for sev, pats in PATTERNS.items()
}


# ─── Funkcje ────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(description="Cisco Catalyst 2960 Log Analyzer")
    parser.add_argument("--host",     required=True, help="IP / hostname switcha")
    parser.add_argument("--username", required=True, help="SSH username")
    parser.add_argument("--password", required=True, help="SSH password")
    parser.add_argument("--secret",   default="",    help="Enable secret (opcjonalnie)")
    return parser.parse_args()


def connect(host, username, password, secret):
    device = {
        "device_type": "cisco_ios",
        "host": host,
        "username": username,
        "password": password,
        "timeout": 30,
        "banner_timeout": 20,
    }
    if secret:
        device["secret"] = secret

    print(f"[*] Lacze sie z {host} ...")
    conn = ConnectHandler(**device)

    if secret:
        conn.enable()

    print(f"[+] Polaczono z {host}")
    return conn


def fetch_log(conn):
    print("[*] Wykonuje 'show log' ...")
    output = conn.send_command(
        "show log",
        read_timeout=60,
        expect_string=r"#",
    )
    return output


def classify_line(line):
    for severity in ("CRITICAL", "ERROR", "WARNING", "INFO"):
        for pattern in COMPILED[severity]:
            if pattern.search(line):
                return severity
    return None


def analyze(log_output):
    lines = log_output.splitlines()
    findings = defaultdict(list)
    for line in lines:
        line = line.strip()
        if not line:
            continue
        sev = classify_line(line)
        if sev:
            findings[sev].append(line)
    return findings, lines


def sep(title="", char="=", width=60):
    if title:
        print(f"\n{char * width}")
        print(f"  {title}")
        print(char * width)
    else:
        print(char * width)


def display_raw(log_output):
    sep("RAW OUTPUT: show log")
    print(log_output)


def display_findings(findings):
    order = ["CRITICAL", "ERROR", "WARNING", "INFO"]
    sep("ANALIZA LOGOW")

    for sev in order:
        items = findings.get(sev, [])
        if not items:
            print(f"\n[{sev}]  -- brak zdarzen")
            continue
        print(f"\n[{sev}]  ({len(items)} zdarzen):")
        for i, line in enumerate(items, 1):
            display = line if len(line) <= 120 else line[:117] + "..."
            print(f"  {i:>3}. {display}")


def display_summary(findings, host):
    sep("PODSUMOWANIE / CO WYMAGA UWAGI")

    total    = sum(len(v) for v in findings.values())
    critical = len(findings.get("CRITICAL", []))
    errors   = len(findings.get("ERROR",    []))
    warnings = len(findings.get("WARNING",  []))
    info     = len(findings.get("INFO",     []))

    print(f"\n  Host       : {host}")
    print(f"  Wszystkich : {total} dopasowania w logach")
    print(f"  CRITICAL   : {critical}")
    print(f"  ERROR      : {errors}")
    print(f"  WARNING    : {warnings}")
    print(f"  INFO       : {info}")
    print()

    if critical == 0 and errors == 0 and warnings == 0:
        print("  [OK] Logi wygladaja czysto -- brak krytycznych zdarzen.")
        return

    print("  PRIORYTETY DO ZBADANIA:")
    priority = 1

    if critical:
        print(f"\n  {priority}. KRYTYCZNE ({critical} zdarzen) -- natychmiastowa interwencja!")
        priority += 1
        for line in findings["CRITICAL"][:5]:
            print(f"     >> {line[:100]}")

    if errors:
        print(f"\n  {priority}. BLEDY ({errors} zdarzen) -- zbadaj jak najszybciej")
        priority += 1
        for line in findings["ERROR"][:5]:
            print(f"     >> {line[:100]}")

    if warnings:
        print(f"\n  {priority}. OSTRZEZENIA ({warnings} zdarzen) -- zaplanuj weryfikacje")
        priority += 1
        for line in findings["WARNING"][:5]:
            print(f"     >> {line[:100]}")

    all_text = "\n".join(
        findings.get("CRITICAL", []) +
        findings.get("ERROR",    []) +
        findings.get("WARNING",  [])
    ).lower()

    print("\n  SZCZEGOLOWE WSKAZOWKI:")
    tips = []

    if "err_disabled" in all_text:
        tips.append("* Porty err-disabled -- sprawdz: show interfaces status err-disabled")
    if "bpduguard" in all_text or "loop" in all_text:
        tips.append("* BPDUGuard/petla STP -- sprawdz topologie spanning-tree")
    if "flap" in all_text:
        tips.append("* MAC flapping -- mozliwa petla lub duplikacja interfejsu")
    if "duplex" in all_text:
        tips.append("* Niezgodnosc dupleksu -- sprawdz konfiguracje interfejsow")
    if "authentication fail" in all_text or "violation" in all_text:
        tips.append("* Naruszenia port-security / 802.1X -- sprawdz polityki dostepu")
    if "temperature" in all_text:
        tips.append("* Przekroczona temperatura -- sprawdz wentylacje switcha")
    if "power" in all_text:
        tips.append("* Problemy z zasilaniem -- sprawdz PSU i PoE budget")
    if "link" in all_text and "down" in all_text:
        tips.append("* Interfejsy down -- sprawdz kable i urzadzenia koncowe")
    if "config" in all_text and "changed" in all_text:
        tips.append("* Zmiany konfiguracji -- sprawdz: show archive log config")

    if tips:
        for tip in tips:
            print(f"     {tip}")
    else:
        print("     (brak szczegolowych wskazowek dla wykrytych wzorow)")

    print()


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()
    host     = args.host
    username = args.username
    password = args.password
    secret   = args.secret or None

    sep(f"Cisco Catalyst 2960 -- Analizator logow SSH")

    try:
        conn = connect(host, username, password, secret)
    except NetmikoAuthenticationException:
        print("[BLAD] Blad autoryzacji -- sprawdz username/password/enable secret.")
        sys.exit(1)
    except NetmikoTimeoutException:
        print(f"[BLAD] Timeout -- nie mozna polaczyc sie z {host}.")
        print("Sprawdz: adres IP, czy SSH jest wlaczone, dostepnosc sieci.")
        sys.exit(1)
    except Exception as e:
        print(f"[BLAD] Nieoczekiwany blad polaczenia: {e}")
        sys.exit(1)

    try:
        log_output = fetch_log(conn)
    finally:
        conn.disconnect()
        print("[*] Rozlaczono.")

    display_raw(log_output)
    findings, _ = analyze(log_output)
    display_findings(findings)
    display_summary(findings, host)


if __name__ == "__main__":
    main()
