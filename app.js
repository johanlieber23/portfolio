const outputEl = document.getElementById("output");
const promptEl = document.getElementById("prompt");
const formEl = document.getElementById("inputForm");
const inputEl = document.getElementById("commandInput");
const screenEl = document.getElementById("screen");

const state = {
  user: "guest",
  hasName: false,
  host: "lenny-portfolio",
  cwd: ["~"],
};

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function scrollToBottom() {
  screenEl.scrollTop = screenEl.scrollHeight;
}

function displayPath(pathParts) {
  if (!pathParts || pathParts.length === 0) return "~";
  if (pathParts.length === 1 && pathParts[0] === "~") return "~";
  if (pathParts[0] !== "~") return `/${pathParts.join("/")}`;
  return `~/${pathParts.slice(1).join("/")}`;
}

function setPrompt() {
  promptEl.textContent = `${state.user}@${state.host}:${displayPath(state.cwd)}$`;
}

function setNameMode(active) {
  formEl.classList.toggle("input--name", active);
  if (active) {
    // Hide prompt completely during name entry.
    promptEl.textContent = "";
  } else {
    setPrompt();
  }
}

function printLine(text, variant) {
  const div = document.createElement("div");
  div.className = variant ? `line line--${variant}` : "line";
  div.innerHTML = escapeHtml(text);
  outputEl.appendChild(div);
  scrollToBottom();
}

function printBlank() {
  printLine(" ", "muted");
}

function printBlock(lines, variant) {
  for (const line of lines) printLine(line, variant);
}

function commandEcho(raw) {
  const cmd = raw.trim();
  if (!cmd) return;
  printLine(`${promptEl.textContent} ${cmd}`, "muted");
}

function normalizeName(input) {
  const raw = input.trim();
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, " ").slice(0, 32);
  const safe = cleaned.replace(/[^\p{L}\p{N} _.-]/gu, "");
  return safe.trim() || null;
}

const content = {
  banner() {
    return [
      "┌──────────────────────────────────────────────┐",
      "│               LENNY PORTFOLIO                │",
      "└──────────────────────────────────────────────┘",
      "Type your name to begin.",
      "Hint: after that, type 'help' for commands.",
    ];
  },
  help() {
    return [
      "Commands (filesystem-style):",
      "  pwd                 - show current directory",
      "  ls [path]            - list directory (default: current)",
      "  cd <path>            - change directory",
      "  cat <file>           - read a file",
      "  tree                 - show directory tree",
      "  clear | cls          - clear the screen",
      "",
      "Shortcuts:",
      "  about | whoami       - show about (same as: cat about/over-mij.txt)",
      "  projects             - list projects (same as: ls projects)",
      "  contact              - show contact (same as: cat contact/contact.txt)",
      "  socials              - show links",
      "",
      "Tip: try 'cd cv' then 'ls' for work/education.",
    ];
  },
  about() {
    return [
      "OVER MIJ",
      "-------",
      "Ik ben Lenny Bos, een 20-jarige student aan de Hogeschool van Amsterdam, waar ik de Associate Degree voor Cyber Security volg.",
      "Ik ben momenteel in mijn eerste jaar en ben gepassioneerd door alles wat met cybersecurity te maken heeft.",
      "",
      "Voor mijn studie heb ik een opleiding Software Development afgerond, wat me een solide technische achtergrond heeft gegeven.",
      "Buiten mijn studie ben ik actief in verschillende sportieve activiteiten en besteed ik veel tijd aan het leren van nieuwe vaardigheden,",
      "met name op het gebied van Cyber Security.",
    ];
  },
  projects() {
    return [
      "PROJECTS",
      "--------",
      "Files in ~/projects:",
      "  dos-attack.txt    - DoS aanval (met video)",
      "  mitm-attack.txt   - Man-in-the-Middle aanval (met video)",
      "  honeypot.txt      - Honeypot (met video)",
      "  dns-spoofing.txt  - DNS spoofing (met video)",
      "",
      "Tip: cat a file, e.g. 'cat projects/dos-attack.txt'",
    ];
  },
  projectDetails(id) {
    if (id === "1") {
      return [
        "PROJECT 1 — Logwatch Dashboard",
        "------------------------------",
        "Goal: Turn raw logs into actionable signals.",
        "Highlights:",
        "- Regex + parsers for common log formats",
        "- Basic anomaly scoring and alerting",
        "- Clean HTML report export",
        "",
        "Stack: Python, pandas (optional), regex, HTML report templates",
      ];
    }
    if (id === "2") {
      return [
        "PROJECT 2 — Web Vuln Lab",
        "------------------------",
        "Goal: Safe playground to practice finding & fixing vulnerabilities.",
        "Highlights:",
        "- Auth/session mistakes, input validation issues, misconfigurations",
        "- Write-ups and patches for each challenge",
        "",
        "Stack: Docker, Node/PHP (choose), SQLite/MySQL (optional)",
      ];
    }
    if (id === "3") {
      return [
        "PROJECT 3 — Password Audit Script",
        "---------------------------------",
        "Goal: Quick checks for local policy & hygiene.",
        "Highlights:",
        "- Policy presence checks (length/complexity/lockout where applicable)",
        "- Detects common weak patterns",
        "- Generates a simple summary report",
        "",
        "Stack: PowerShell, Windows security tooling",
      ];
    }
    return null;
  },
  contact() {
    return [
      "CONTACT",
      "-------",
      "Email: lenny.bos07@gmail.com",
      "Locatie: Den Haag, NL",
      "",
      "DM kan ook via LinkedIn:",
      "  https://www.linkedin.com/in/lennybos",
    ];
  },
  socials() {
    return [
      "LINKS",
      "-----",
      "LinkedIn: https://www.linkedin.com/in/lennybos",
      "TryHackMe: https://tryhackme.com/p/lennybos",
      "Hack The Box: https://ctf.hackthebox.com/user/profile/1011845",
    ];
  },
};

const fs = {
  type: "dir",
  children: {
    about: {
      type: "dir",
      children: {
        "over-mij.txt": { type: "file", lines: content.about() },
        "vaardigheden.txt": {
          type: "file",
          lines: [
            "VAARDIGHEDEN",
            "-----------",
            "Cyber Security:",
            "- Actieve studie van netwerken, beveiliging en ethisch hacken.",
            "",
            "Software Development:",
            "- Ervaring met webontwikkeling en het onderhouden van websites.",
            "",
            "Leergierigheid:",
            "- Ik ben altijd op zoek naar nieuwe kennis en manieren om mijn vaardigheden verder te ontwikkelen.",
          ],
        },
      },
    },
    cv: {
      type: "dir",
      children: {
        "werkervaring.txt": {
          type: "file",
          lines: [
            "WERKERVARING",
            "-----------",
            "Pakket Leverancier – DHL (2025-2026)",
            "- Bezorging van pakketten en organiseren van leveringen.",
            "",
            "Software Developer – Modern Media Hub (2024-2025)",
            "- Ontwikkelen en onderhouden van websites.",
            "- Aanpassen van applicaties op basis van klantbehoeften.",
            "",
            "Logistiek Medewerker – DHL (2023-2024)",
            "- Uitvoeren van inspecties en sorteren van pakketten.",
          ],
        },
        "opleidingen.txt": {
          type: "file",
          lines: [
            "OPLEIDINGEN",
            "----------",
            "Cyber Security – Hogeschool van Amsterdam (2025-2027)",
            "Software Development – ROC Mondriaan (2022-2025)",
          ],
        },
      },
    },
    projects: {
      type: "dir",
      children: {
        "projects.txt": { type: "file", lines: content.projects() },
        "dos-attack.txt": {
          type: "file",
          lines: [
            "PROJECT — DOS ATTACK",
            "--------------------",
            "Omschrijving:",
            "- Demonstratie/onderzoek naar DoS (Denial-of-Service) binnen een gecontroleerde omgeving.",
            "",
            "YouTube:",
            "- https://youtu.be/0zw26tSzFls",
          ],
        },
        "mitm-attack.txt": {
          type: "file",
          lines: [
            "PROJECT — MAN-IN-THE-MIDDLE (MITM)",
            "---------------------------------",
            "Omschrijving:",
            "- Demonstratie van een MITM-aanval in een lab omgeving en hoe je dit detecteert/mitigeert.",
            "",
            "YouTube:",
            "- https://youtu.be/Q5j742jkTKk",
          ],
        },
        "honeypot.txt": {
          type: "file",
          lines: [
            "PROJECT — HONEYPOT",
            "------------------",
            "Omschrijving:",
            "- Opzetten van een honeypot om aanvallen te observeren en logdata te verzamelen.",
            "",
            "YouTube:",
            "- https://youtu.be/SdyMWyrWGLI",
          ],
        },
        "dns-spoofing.txt": {
          type: "file",
          lines: [
            "PROJECT — DNS SPOOFING",
            "----------------------",
            "Omschrijving:",
            "- Demonstratie van DNS spoofing en het effect op verkeer binnen een lab omgeving.",
            "",
            "YouTube:",
            "- https://youtu.be/SgbNDNdCYZ4",
          ],
        },
      },
    },
    contact: {
      type: "dir",
      children: {
        "contact.txt": { type: "file", lines: content.contact() },
        "links.txt": { type: "file", lines: content.socials() },
      },
    },
    "help.txt": { type: "file", lines: content.help() },
  },
};

function getNode(pathParts) {
  // pathParts are like ["~","about","about.txt"] or ["about"]
  const parts = [...pathParts];
  if (parts[0] === "~") parts.shift();

  let node = fs;
  for (const p of parts) {
    if (!node || node.type !== "dir") return null;
    node = node.children?.[p] ?? null;
  }
  return node;
}

function resolvePath(input, fromCwd = state.cwd) {
  const raw = (input ?? "").trim();
  if (!raw || raw === ".") return [...fromCwd];

  // absolute path: /about -> treat as from root
  let parts;
  if (raw.startsWith("/")) {
    parts = ["~", ...raw.split("/").filter(Boolean)];
  } else if (raw.startsWith("~")) {
    const rest = raw === "~" ? "" : raw.slice(1);
    parts = ["~", ...rest.split("/").filter(Boolean)];
  } else {
    parts = [...fromCwd, ...raw.split("/").filter(Boolean)];
  }

  // normalize ., ..
  const out = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (out.length > 1) out.pop(); // keep "~" as root
      continue;
    }
    if (out.length === 0 && part !== "~") out.push("~");
    if (part === "~") {
      out.length = 0;
      out.push("~");
      continue;
    }
    out.push(part);
  }
  if (out.length === 0) out.push("~");
  return out;
}

function listDir(pathParts) {
  const node = getNode(pathParts);
  if (!node) return { error: "No such file or directory" };
  if (node.type !== "dir") return { error: "Not a directory" };

  const names = Object.keys(node.children ?? {});
  names.sort((a, b) => a.localeCompare(b));
  const display = names.map((name) => {
    const child = node.children[name];
    return child?.type === "dir" ? `${name}/` : name;
  });
  return { lines: display.length ? display : ["(empty)"] };
}

function readFile(pathParts) {
  const node = getNode(pathParts);
  if (!node) return { error: "No such file or directory" };
  if (node.type !== "file") return { error: "Not a file" };
  return { lines: node.lines ?? ["(empty)"] };
}

function treeLines(node, prefix = "") {
  if (!node || node.type !== "dir") return [];
  const entries = Object.entries(node.children ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const out = [];
  entries.forEach(([name, child], idx) => {
    const last = idx === entries.length - 1;
    const branch = last ? "└── " : "├── ";
    const nextPrefix = prefix + (last ? "    " : "│   ");
    out.push(`${prefix}${branch}${child.type === "dir" ? `${name}/` : name}`);
    if (child.type === "dir") out.push(...treeLines(child, nextPrefix));
  });
  return out;
}

const COMMANDS = [
  "pwd",
  "ls",
  "cd",
  "cat",
  "tree",
  "clear",
  "cls",
  "help",
  "?",
  "about",
  "whoami",
  "projects",
  "contact",
  "socials",
  "echo",
];

function splitPathToken(pathToken) {
  // returns { base: string, fragment: string, hasTrailingSlash: boolean }
  const hasTrailingSlash = pathToken.endsWith("/");
  const parts = pathToken.split("/");
  if (parts.length === 1) return { base: "", fragment: parts[0], hasTrailingSlash };
  const fragment = hasTrailingSlash ? "" : parts[parts.length - 1];
  const base = parts.slice(0, parts.length - 1).join("/");
  return { base, fragment, hasTrailingSlash };
}

function listChildrenNames(dirPathParts, dirsOnly = false) {
  const node = getNode(dirPathParts);
  if (!node || node.type !== "dir") return [];
  return Object.keys(node.children ?? {})
    .filter((name) => {
      if (!dirsOnly) return true;
      return node.children?.[name]?.type === "dir";
    })
    .sort((a, b) => a.localeCompare(b));
}

function applyCompletionToInput(before, completedToken, addSpace) {
  inputEl.value = `${before}${completedToken}${addSpace ? " " : ""}`;
  // keep caret at end
  inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
}

function handleTabAutocomplete() {
  const value = inputEl.value;
  const trimmedLeft = value.replace(/^\s+/, "");
  const caretAtEnd = inputEl.selectionStart === value.length;
  if (!caretAtEnd) return;

  // If only typing a command (no spaces yet), autocomplete command names.
  const hasSpace = /\s/.test(trimmedLeft);
  if (!hasSpace) {
    const partial = trimmedLeft;
    const matches = COMMANDS.filter((c) => c.startsWith(partial.toLowerCase()));
    if (matches.length === 0) return;
    if (matches.length === 1) {
      applyCompletionToInput(value.slice(0, value.length - trimmedLeft.length), matches[0], true);
      return;
    }
    printBlock(["Matches:", ...matches.map((m) => `  ${m}`)], "muted");
    return;
  }

  // Path completion for cd/ls/cat/type
  const tokens = trimmedLeft.split(/\s+/);
  const command = tokens[0]?.toLowerCase();
  const supportsPath = ["cd", "ls", "cat", "type"].includes(command);
  if (!supportsPath) return;

  // We autocomplete the last token as a path.
  const beforeLastToken = trimmedLeft.slice(0, trimmedLeft.lastIndexOf(tokens[tokens.length - 1]));
  const lastToken = tokens[tokens.length - 1] ?? "";

  const dirsOnly = command === "cd";
  const { base, fragment } = splitPathToken(lastToken);
  const baseResolved = resolvePath(base || ".", state.cwd);
  const childNames = listChildrenNames(baseResolved, dirsOnly);

  const matches = childNames.filter((n) => n.toLowerCase().startsWith(fragment.toLowerCase()));
  if (matches.length === 0) return;

  const basePrefix = base ? `${base.replace(/\/+$/, "")}/` : "";
  if (matches.length === 1) {
    const matchName = matches[0];
    const node = getNode([...baseResolved, matchName]);
    const suffix = node?.type === "dir" ? "/" : "";
    const completed = `${basePrefix}${matchName}${suffix}`;
    const prefixSpaces = value.slice(0, value.length - trimmedLeft.length);
    applyCompletionToInput(prefixSpaces + beforeLastToken, completed, false);
    return;
  }

  printBlock(
    [
      "Matches:",
      ...matches.map((m) => {
        const node = getNode([...baseResolved, m]);
        return `  ${basePrefix}${node?.type === "dir" ? `${m}/` : m}`;
      }),
    ],
    "muted",
  );
}

function clearScreen() {
  outputEl.innerHTML = "";
}

function handlePreName(input) {
  const name = normalizeName(input);
  if (!name) {
    printLine("Please enter a valid name (letters/numbers).", "error");
    return;
  }
  state.user = name;
  state.hasName = true;
  setNameMode(false);

  printBlank();
  printLine(`Access granted. Welcome, ${state.user}.`, "accent");
  printLine("Type 'help' to see commands.", "muted");
  printBlank();
}

function runCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const lower = trimmed.toLowerCase();
  const [cmd, ...rest] = trimmed.split(/\s+/);
  const cmdLower = cmd.toLowerCase();

  if (cmdLower === "clear" || cmdLower === "cls") {
    clearScreen();
    return;
  }

  if (cmdLower === "help" || cmdLower === "?") {
    printBlock(content.help());
    return;
  }

  if (cmdLower === "pwd") {
    printLine(displayPath(state.cwd));
    return;
  }

  if (cmdLower === "ls" || cmdLower === "dir") {
    const arg = rest.join(" ").trim();
    const target = resolvePath(arg || ".", state.cwd);
    const res = listDir(target);
    if (res.error) {
      printLine(`ls: ${res.error}`, "error");
      return;
    }
    printBlock(res.lines);
    return;
  }

  if (cmdLower === "cd") {
    const arg = rest.join(" ").trim();
    const target = resolvePath(arg || "~", state.cwd);
    const node = getNode(target);
    if (!node) {
      printLine("cd: No such file or directory", "error");
      return;
    }
    if (node.type !== "dir") {
      printLine("cd: Not a directory", "error");
      return;
    }
    state.cwd = target;
    setPrompt();
    return;
  }

  if (cmdLower === "cat" || cmdLower === "type") {
    const arg = rest.join(" ").trim();
    if (!arg) {
      printLine("cat: missing file operand", "error");
      return;
    }
    const target = resolvePath(arg, state.cwd);
    const res = readFile(target);
    if (res.error) {
      printLine(`cat: ${res.error}`, "error");
      return;
    }
    printBlock(res.lines);
    return;
  }

  if (cmdLower === "tree") {
    const lines = ["~", ...treeLines(fs)];
    printBlock(lines);
    return;
  }

  // Shortcuts (feel like terminal aliases)
  if (cmdLower === "about" || cmdLower === "whoami") {
    printBlock(content.about());
    printBlank();
    printLine("Tip: ls about  |  cat about/vaardigheden.txt  |  cd cv", "muted");
    return;
  }

  if (cmdLower === "projects") {
    const res = listDir(resolvePath("projects", ["~"]));
    if (res.lines) printBlock(["projects/", ...res.lines.map((l) => `  ${l}`)]);
    printBlank();
    printBlock(content.projects());
    return;
  }

  if (cmdLower === "contact") {
    printBlock(content.contact());
    return;
  }

  if (cmdLower === "socials") {
    printBlock(content.socials());
    return;
  }

  if (["1", "2", "3"].includes(cmdLower)) {
    const detail = content.projectDetails(cmdLower);
    if (detail) printBlock(detail);
    return;
  }

  if (cmdLower === "echo") {
    printLine(trimmed.slice(5));
    return;
  }

  printLine(`Command not found: ${trimmed}`, "error");
  printLine("Type 'help' to see available commands.", "muted");
}

function boot() {
  setNameMode(true);
  printBlock(content.banner(), "accent");
  printBlank();
  printLine("Enter name:", "muted");
  inputEl.focus();
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = inputEl.value;
  inputEl.value = "";

  if (!raw.trim()) return;

  if (!state.hasName) {
    printLine(`Enter name: ${raw.trim()}`, "muted");
    handlePreName(raw);
    return;
  }

  commandEcho(raw);
  runCommand(raw);
  printBlank();
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  e.preventDefault();
  handleTabAutocomplete();
});

window.addEventListener("click", () => {
  inputEl.focus();
});

boot();

