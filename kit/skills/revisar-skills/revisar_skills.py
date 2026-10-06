#!/usr/bin/env python3
"""Cruza los skills instalados con los skills de oficio de cada agente."""
import argparse
import glob
import os
import re
import sys

EXCLUIR = ("idea-nueva", "revisar-skills")
AGENTES_POR_DEFECTO = r"{{EQUIPOS}}\agents"


def leer(ruta):
    try:
        with open(ruta, encoding="utf-8-sig", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def frontmatter(texto):
    """Devuelve (name, description) del frontmatter, tolerando bloques > y |."""
    m = re.match(r"\s*---\s*\r?\n(.*?)\r?\n---", texto, re.S)
    if not m:
        return None, ""
    lineas = m.group(1).splitlines()
    campos = {}
    clave = None
    for ln in lineas:
        k = re.match(r"^([A-Za-z_-]+):\s*(.*)$", ln)
        if k and not ln.startswith((" ", "\t")):
            clave = k.group(1)
            valor = k.group(2).strip()
            campos[clave] = "" if valor in (">", "|", ">-", "|-") else valor
        elif clave and ln.strip():
            campos[clave] = (campos[clave] + " " + ln.strip()).strip()
    desc = campos.get("description", "").strip("\"'")
    return campos.get("name", "").strip("\"'") or None, desc


def skills_instalados():
    home = os.path.expanduser("~")
    base = os.path.join(home, ".claude")
    rutas = glob.glob(os.path.join(base, "skills", "*", "SKILL.md"))
    plugins = os.path.join(base, "plugins")
    if os.path.isdir(plugins):
        rutas += glob.glob(os.path.join(plugins, "**", "skills", "*", "SKILL.md"), recursive=True)
    skills = {}
    for r in sorted(set(rutas)):
        nombre, desc = frontmatter(leer(r))
        nombre = nombre or os.path.basename(os.path.dirname(r))
        skills.setdefault(nombre, desc)
    return skills


def skills_de_agentes(carpeta):
    """Devuelve {agente: [skills]} desde la línea «Skills de tu oficio»."""
    resultado = {}
    for ruta in sorted(glob.glob(os.path.join(carpeta, "*", "*.md"))):
        for ln in leer(ruta).splitlines():
            if "Skills de tu oficio" in ln:
                nombres = re.findall(r"`([^`]+)`", ln.split("Skills de tu oficio", 1)[1])
                resultado[os.path.splitext(os.path.basename(ruta))[0]] = nombres
                break
    return resultado


def coincide(token, nombre):
    return token == nombre or token.split(":")[-1] == nombre.split(":")[-1]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--agents", default=AGENTES_POR_DEFECTO, help="carpeta de agentes")
    args = ap.parse_args()

    instalados = skills_instalados()
    agentes = skills_de_agentes(args.agents)

    usos = {}
    for nombre in instalados:
        usos[nombre] = [a for a, toks in agentes.items() if any(coincide(t, nombre) for t in toks)]

    print("SKILL -> AGENTES")
    for nombre in sorted(usos):
        if usos[nombre]:
            print(f"{nombre} -> {', '.join(sorted(usos[nombre]))}")

    sin = [n for n in sorted(usos)
           if not usos[n] and not n.startswith("equipo-") and n not in EXCLUIR]
    print()
    print("SIN ASIGNAR:")
    for n in sin:
        print(f"- {n}: {instalados[n][:100]}")

    asignados = sum(1 for n in usos if usos[n])
    print(f"TOTAL skills={len(instalados)} asignados={asignados} sin_asignar={len(sin)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
