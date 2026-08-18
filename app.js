const outputEl = document.getElementById("output");
const promptEl = document.getElementById("prompt");
const formEl = document.getElementById("inputForm");
const inputEl = document.getElementById("commandInput");
const screenEl = document.getElementById("screen");
const yodaGuideEl = document.querySelector(".yoda-guide");
const yodaSpeechEl = document.getElementById("yodaSpeech");
const yodaImageEl = document.getElementById("yodaImage");
const yodaVideoEl = document.getElementById("yodaVideo");
const yodaCanvasEl = document.getElementById("yodaCanvas");
const yodaCanvasContext = yodaCanvasEl.getContext("2d", { willReadFrequently: true });
let yodaAnimationFrame = null;
let yodaWaveTimer = null;

const yodaImages = {
  idle: "./yodapixel.webp",
  typing: "./yoda-looking-right.png",
  waving: "./yoda-wave.png",
};

function setYodaImage(stateName) {
  yodaGuideEl.classList.remove("yoda-guide--talking");
  yodaImageEl.src = yodaImages[stateName];
}

function setYodaTip(message, imageState = "idle") {
  clearTimeout(yodaWaveTimer);
  setYodaImage(imageState);
  yodaSpeechEl.textContent = message;
}

function renderTalkingYoda() {
  if (yodaVideoEl.paused || yodaVideoEl.ended) return;

  const sourceWidth = yodaVideoEl.videoWidth;
  const sourceHeight = yodaVideoEl.videoHeight;
  if (sourceWidth && sourceHeight) {
    const scale = Math.min(1, 480 / sourceWidth);
    const width = Math.round(sourceWidth * scale);
    const height = Math.round(sourceHeight * scale);
    if (yodaCanvasEl.width !== width || yodaCanvasEl.height !== height) {
      yodaCanvasEl.width = width;
      yodaCanvasEl.height = height;
    }

    yodaCanvasContext.drawImage(yodaVideoEl, 0, 0, width, height);
    const frame = yodaCanvasContext.getImageData(0, 0, width, height);
    const pixels = frame.data;
    const cornerIndexes = [0, (width - 1) * 4, (height - 1) * width * 4, (height * width - 1) * 4];
    const background = cornerIndexes.reduce(
      (color, index) => [color[0] + pixels[index], color[1] + pixels[index + 1], color[2] + pixels[index + 2]],
      [0, 0, 0],
    ).map((value) => value / cornerIndexes.length);

    for (let index = 0; index < pixels.length; index += 4) {
      const distance = Math.hypot(
        pixels[index] - background[0],
        pixels[index + 1] - background[1],
        pixels[index + 2] - background[2],
      );
      if (distance < 48) pixels[index + 3] = 0;
      else if (distance < 85) pixels[index + 3] = Math.round(((distance - 48) / 37) * 255);
    }

    yodaCanvasContext.putImageData(frame, 0, 0);
  }

  yodaAnimationFrame = requestAnimationFrame(renderTalkingYoda);
}

const state = {
  user: "guest",
  hasName: false,
  host: "lenny.bos",
  cwd: ["~"],
  booting: true,
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

async function typeLine(text, variant, delayMs = 28) {
  const div = document.createElement("div");
  div.className = variant ? `line line--${variant}` : "line";
  outputEl.appendChild(div);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    div.textContent = text;
    scrollToBottom();
    return;
  }

  for (const character of text) {
    div.textContent += character;
    scrollToBottom();
    await sleep(delayMs);
  }
}

function highlightClassicView() {
  const classicViewLink = document.querySelector(".page-switch");
  if (!classicViewLink) return;
  classicViewLink.classList.add("page-switch--attention");
  window.setTimeout(() => classicViewLink.classList.remove("page-switch--attention"), 8000);
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
      "Lenny Bos",
      "Cyber Security  ·  Software Development",
      "",
      "Enter your name to begin.",
      "Type help for available commands.",
    ];
  },
  help() {
    return [
      "Explore:",
      "  about       over mij",
      "  projects    mijn werk",
      "  contact     contactgegevens",
      "  socials     profielen en links",
      "",
      "Terminal: ls, cd, cat, tree, pwd, clear",
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
      "GitHub: https://github.com/johanlieber23",
      "TryHackMe: https://tryhackme.com/p/lb0z",
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
  if (state.booting) return;
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

  yodaSpeechEl.textContent = `Hello, ${name}! Welcome to Lenny's terminal.`;
  yodaVideoEl.pause();
  cancelAnimationFrame(yodaAnimationFrame);
  clearTimeout(yodaWaveTimer);
  setYodaImage("waving");
  yodaWaveTimer = setTimeout(() => {
    setYodaImage("idle");
    yodaSpeechEl.textContent = "Type 'help' to see all available commands!";
  }, 3000);

  printBlank();
  printLine(`Welcome, ${state.user}.`, "accent");
  printLine("Type 'help' to explore.", "muted");
  printBlank();
}

yodaVideoEl.addEventListener("ended", () => {
  cancelAnimationFrame(yodaAnimationFrame);
  yodaGuideEl.classList.remove("yoda-guide--talking");
});

function runCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const lower = trimmed.toLowerCase();
  const [cmd, ...rest] = trimmed.split(/\s+/);
  const cmdLower = cmd.toLowerCase();

  if (cmdLower === "clear" || cmdLower === "cls") {
    clearScreen();
    setYodaTip("Clean slate! Type 'help' whenever you need the command list.");
    return;
  }

  if (cmdLower === "help" || cmdLower === "?") {
    printBlock(content.help());
    setYodaTip("Start with 'projects' to explore Lenny's work, or try 'about' to learn more about him.");
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
      setYodaTip("That location could not be listed. Type 'pwd' to check where you are.");
      return;
    }
    printBlock(res.lines);
    if (target.join("/") === "~/projects") {
      setYodaTip("These are the project files. Type 'cat <filename>' to read one, for example: cat honeypot.txt");
    } else {
      setYodaTip("Type 'cd <folder>' to enter a folder, or 'cat <filename>' to read a file.");
    }
    return;
  }

  if (cmdLower === "cd") {
    const arg = rest.join(" ").trim();
    const target = resolvePath(arg || "~", state.cwd);
    const node = getNode(target);
    if (!node) {
      printLine("cd: No such file or directory", "error");
      setYodaTip("I can't find that folder. Type 'ls' to see the available names.");
      return;
    }
    if (node.type !== "dir") {
      printLine("cd: Not a directory", "error");
      setYodaTip("That is a file. Use 'cat <filename>' to read it instead.");
      return;
    }
    state.cwd = target;
    setPrompt();
    setYodaTip(`You're now in ${displayPath(target)}. Type 'ls' to see what's inside.`);
    return;
  }

  if (cmdLower === "cat" || cmdLower === "type") {
    const arg = rest.join(" ").trim();
    if (!arg) {
      printLine("cat: missing file operand", "error");
      setYodaTip("Add a filename after 'cat', for example: cat projects.txt");
      return;
    }
    const target = resolvePath(arg, state.cwd);
    const res = readFile(target);
    if (res.error) {
      printLine(`cat: ${res.error}`, "error");
      setYodaTip("I can't read that file. Type 'ls' and copy one of the filenames exactly.");
      return;
    }
    printBlock(res.lines);
    setYodaTip("Nice! Try another file, or type 'cd ..' to go back one folder.");
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
    setYodaTip("Want more detail? Type 'cat about/vaardigheden.txt' to see Lenny's skills.");
    return;
  }

  if (cmdLower === "projects") {
    state.cwd = ["~", "projects"];
    setPrompt();
    printLine("Opened ~/projects", "accent");
    setYodaTip("You're in the projects folder. Type 'ls' to see all available project files.");
    return;
  }

  if (cmdLower === "contact") {
    printBlock(content.contact());
    setYodaTip("You can email Lenny or use the 'socials' command to see all his profile links.");
    return;
  }

  if (cmdLower === "socials") {
    printBlock(content.socials());
    setYodaTip("Those are Lenny's profiles. Type 'projects' if you want to continue exploring his work.");
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
  setYodaTip("I don't know that command yet. Type 'help' to see the commands you can use.");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bootStatus(label, totalWidth = 44) {
  const suffix = " [ OK ]";
  const dots = Math.max(4, totalWidth - label.length - suffix.length);
  return `${label}${".".repeat(dots)}${suffix}`;
}

function kernelLine(seconds, message) {
  const ts = seconds.toFixed(6).padStart(12, " ");
  return `[${ts}] ${message}`;
}

async function printLinesFast(lines, delayMs) {
  for (const { text, variant } of lines) {
    printLine(text, variant);
    await sleep(delayMs);
  }
}

async function pauseThenClear(ms) {
  await sleep(ms);
  clearScreen();
}

async function runBootSequence() {
  state.booting = true;
  inputEl.disabled = true;
  formEl.classList.add("input--booting");

  // Phase 1 — firmware / POST
  await printLinesFast(
    [
      { text: "LENNY-PORTFOLIO UEFI Firmware v2.14", variant: "muted" },
      { text: "Copyright (c) 2026 Lenny Bos", variant: "muted" },
      { text: "", variant: "muted" },
      { text: "CPU: Virtual Core i7 @ 3.20GHz", variant: "muted" },
      { text: "RAM: 8192 MB DDR4 — OK", variant: "ok" },
      { text: "Storage: NVMe 512GB — detected", variant: "ok" },
      { text: "Network: Intel I219-V — link up", variant: "ok" },
      { text: "Booting from Hard Disk...", variant: "muted" },
    ],
    62,
  );
  await pauseThenClear(320);

  // Phase 2 — kernel ring buffer
  let t = 0;
  const kernelBoot = [
    kernelLine(t, "Linux version 6.8.0-portfolio (lenny@build)"),
    kernelLine((t += 0.012341), "Command line: BOOT_IMAGE=/vmlinuz quiet splash"),
    kernelLine((t += 0.028104), "x86/fpu: Supporting XSAVE feature 0x001"),
    kernelLine((t += 0.041882), "ACPI: Core revision 20230331"),
    kernelLine((t += 0.067441), "PCI: Using configuration type 1 for base access"),
    kernelLine((t += 0.089102), "VFS: Disk quotas dquot_6.6.0"),
    kernelLine((t += 0.112884), "Block layer SCSI generic (bsg) driver version 0.4"),
    kernelLine((t += 0.145221), "TCP bind hash table entries: 65536"),
    kernelLine((t += 0.178903), "NET: Registered PF_INET protocol family"),
    kernelLine((t += 0.201447), "systemd[1]: systemd 255.4 running in system mode"),
  ];

  const modules = [
    "ext4",
    "nf_tables",
    "kvm_intel",
    "cfg80211",
    "usbcore",
    "ahci",
    "i915",
    "snd_hda_intel",
    "tls",
    "loop",
    "squashfs",
    "overlay",
    "fuse",
    "dm_mod",
    "crc32c",
  ];

  for (const mod of modules) {
    t += 0.018 + Math.random() * 0.022;
    kernelBoot.push(kernelLine(t, `${mod}: module loaded`));
  }

  kernelBoot.push(
    kernelLine((t += 0.044), "systemd[1]: Mounted root filesystem on /dev/nvme0n1p2"),
    kernelLine((t += 0.031), "systemd[1]: Reached target Local File Systems"),
  );

  await printLinesFast(
    kernelBoot.map((text) => ({ text, variant: "muted" })),
    44,
  );
  await pauseThenClear(260);

  // Phase 3 — systemd bringing up services
  const units = [
    "udev.service",
    "systemd-journald.service",
    "systemd-udevd.service",
    "systemd-networkd.service",
    "systemd-resolved.service",
    "systemd-timesyncd.service",
    "dbus.service",
    "polkit.service",
    "NetworkManager.service",
    "cron.service",
    "rsyslog.service",
    "ssh.service",
    "portfolio-fs.service",
    "portfolio-auth.service",
    "portfolio-shell.service",
    "getty@tty1.service",
    "multi-user.target",
  ];

  const systemdLines = [];
  for (const unit of units) {
    systemdLines.push({ text: `         Starting ${unit}...`, variant: "muted" });
    systemdLines.push({ text: bootStatus(`Started ${unit}`, 52), variant: "ok" });
  }

  const binaries = [
    "/sbin/init",
    "/bin/bash",
    "/lib/systemd/systemd",
    "/usr/lib/portfolio/fs-driver.so",
    "/usr/lib/portfolio/auth.so",
    "/usr/bin/portfolio-core",
    "/usr/lib/modules/6.8.0/netfilter.ko",
    "/usr/lib/modules/6.8.0/nftables.ko",
    "/etc/systemd/system/portfolio.service",
    "/home/lenny/.profile",
  ];

  for (const path of binaries) {
    systemdLines.push({ text: bootStatus(`Loading ${path}`), variant: "ok" });
  }

  await printLinesFast(systemdLines, 32);
  await pauseThenClear(240);

  // Phase 4 — final handoff (brief flash, then wipe)
  await printLinesFast(
    [
      { text: kernelLine(4.812004, "systemd[1]: Reached target Graphical Interface"), variant: "muted" },
      { text: bootStatus("Starting portfolio login service", 52), variant: "ok" },
      { text: "System boot complete.", variant: "accent" },
    ],
    140,
  );
  await sleep(400);
  clearScreen();
}

async function boot() {
  setNameMode(true);
  await runBootSequence();
  highlightClassicView();
  await typeLine("Prefer the normal portfolio website?", "hacker", 26);
  await typeLine("Click 'Classic view' in the top-right corner.", "muted", 22);
  printBlank();
  printLine("Enter your name to begin.", "muted");
  state.booting = false;
  inputEl.disabled = false;
  formEl.classList.remove("input--booting");
  inputEl.focus();
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  if (state.booting) return;
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

inputEl.addEventListener("input", () => {
  if (state.booting || state.hasName) return;
  setYodaImage(inputEl.value.trim() ? "typing" : "idle");
});

window.addEventListener("click", () => {
  if (!state.booting) inputEl.focus();
});

boot();

