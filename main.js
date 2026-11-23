"use strict";

const projects = [...document.querySelectorAll("[data-file]")];
const filters = document.querySelector(".filters");
const filterButtons = [...filters.querySelectorAll("button")];
const tally = document.querySelector(".tally");

function filterProjects(category) {
  for (const button of filterButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === category));
  }
  let count = 0;
  for (const project of projects) {
    project.hidden = category !== "all" && project.dataset.category !== category;
    if (!project.hidden) count++;
  }
  tally.textContent = count + (count === 1 ? " project" : " projects");
}

filters.hidden = false;
filterProjects("all");
for (const button of filterButtons) {
  button.addEventListener("click", () => filterProjects(button.dataset.filter));
}

function getLinkedProject(hash) {
  return projects.find(project => "#" + project.id === hash);
}

function openProject(project) {
  if (project.hidden) filterProjects("all");
  project.open = true;
}

for (const link of document.querySelectorAll("[data-project-link]")) {
  link.addEventListener("click", () => openProject(getLinkedProject(link.hash)));
}

function revealLinkedProject() {
  const project = getLinkedProject(location.hash);
  if (!project) return;
  openProject(project);
  project.scrollIntoView();
}

revealLinkedProject();
window.addEventListener("hashchange", revealLinkedProject);

const terminal = document.querySelector("#terminal");
const trigger = document.querySelector("[data-terminal]");
const input = document.querySelector("#command-input");
const output = document.querySelector("#terminal-output");
const files = new Map(projects.map(project => [
  project.dataset.file + ".txt",
  project.querySelector(".project-detail > p").textContent
]));
const navigation = new Map([
  ["work", "#work"], ["archive", "#archive"], ["about", "#about"],
  ["experience", "#experience"], ["highlights", "#highlights"], ["contact", "#contact"]
]);
const commands = {
  help: () => "help · about · projects · contact · ls · cat <file> · pwd · clear\nopen <section> — work, archive, about, experience, highlights or contact",
  about: () => "Lenny Bos · Cyber Security student at HvA\nFocus: threat hunting, detection engineering and identity security.\nIncoming graduation intern at Rijkswaterstaat, February 2027.",
  projects: () => projects.map(project => project.querySelector(".project-title").textContent).join("\n"),
  contact: () => "Email: lenny.bos07@gmail.com\nLinkedIn: linkedin.com/in/lennybos\nGitHub: github.com/johanlieber23\nOpen to graduate and entry-level roles from July 2027.",
  ls: () => [...files.keys()].join("\n"),
  cat: file => files.get(file) ?? "File not found. Type ls for the available project files.",
  pwd: () => "/home/guest/portfolio",
  clear: () => { output.replaceChildren(); },
  open: section => {
    const target = navigation.get(section);
    if (!target) return "Choose a section: " + [...navigation.keys()].join(", ") + ".";
    terminal.close();
    location.hash = target;
    const heading = document.querySelector(target + " h2, " + target + " h3") ?? document.querySelector(target);
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    document.querySelector(target).scrollIntoView();
  }
};

function appendLine(message, className = "") {
  const line = document.createElement("p");
  line.className = className;
  line.textContent = message;
  output.append(line);
}

function runCommand(value) {
  const commandLine = value.trim();
  if (!commandLine) return;
  const [command, argument] = commandLine.toLowerCase().split(/\s+/, 2);
  appendLine("guest@lenny:~$ " + commandLine, "command-echo");
  const answer = Object.hasOwn(commands, command) ? commands[command](argument) : "Unknown command. Type help for available commands.";
  if (answer) appendLine(answer);
  output.scrollTop = output.scrollHeight;
}

trigger.parentElement.hidden = false;
trigger.addEventListener("click", () => terminal.showModal());
document.querySelector(".command-form").addEventListener("submit", event => {
  event.preventDefault();
  runCommand(input.value);
  input.value = "";
  if (terminal.open) input.focus();
});

for (const button of document.querySelectorAll("[data-command]")) {
  button.addEventListener("click", () => {
    runCommand(button.dataset.command);
    input.focus();
  });
}
