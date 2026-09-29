const technologyRows = {
  security: [
    ["Wazuh", "https://wazuh.com/favicon.ico", "W"],
    ["Wireshark", "wireshark", "Wi"],
    ["Nmap", "https://nmap.org/images/nmap-logo-64px.png", "N"],
    ["Burp Suite", "burpsuite", "B"],
    ["Kali Linux", "kalilinux", "K"],
    ["Hack The Box", "hackthebox", "HTB"],
    ["TryHackMe", "tryhackme", "THM"],
  ],
  development: [
    ["Windows", "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/windows11/windows11-original.svg", "W"],
    ["Linux", "linux", "L"],
    ["PowerShell", "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/powershell/powershell-original.svg", "PS"],
    ["VirtualBox", "virtualbox", "VB"],
    ["Python", "python", "Py"],
    ["Git", "git", "G"],
    ["JavaScript", "javascript", "JS"],
    ["React", "react", "R"],
    ["WordPress", "wordpress", "WP"],
  ],
};

function createTechnologySet(items, duplicate) {
  const set = document.createElement("div");
  set.className = "tech-set";
  if (duplicate) set.setAttribute("aria-hidden", "true");

  for (const [name, icon, initials] of items) {
    const chip = document.createElement("span");
    chip.className = "tech-chip";

    const image = document.createElement("img");
    image.src = icon.startsWith("https://") ? icon : `https://cdn.simpleicons.org/${icon}`;
    image.alt = "";
    image.loading = "eager";
    image.width = 21;
    image.height = 21;
    image.addEventListener("error", () => chip.classList.add("tech-chip--fallback"));

    const fallback = document.createElement("span");
    fallback.className = "tech-chip__fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = initials;

    chip.append(image, fallback, document.createTextNode(name));
    set.append(chip);
  }
  return set;
}

for (const marquee of document.querySelectorAll("[data-tech-list]")) {
  const items = technologyRows[marquee.dataset.techList];
  if (!items) continue;
  const track = document.createElement("div");
  track.className = "tech-track";
  track.append(createTechnologySet(items, false), createTechnologySet(items, true));
  marquee.replaceChildren(track);
}

const githubSnapshot = {
  start: "2025-09-28",
  end: "2026-09-29",
  days: [
    ["2025-10-11",4,2],["2025-10-25",6,2],["2025-10-28",6,2],
    ["2026-02-16",3,1],["2026-02-17",6,2],["2026-02-18",5,2],["2026-02-19",1,1],["2026-02-28",3,1],
    ["2026-03-03",1,1],["2026-03-10",4,2],["2026-03-30",1,1],
    ["2026-04-06",3,1],["2026-04-13",5,2],["2026-04-14",2,1],["2026-04-15",2,1],["2026-04-17",3,1],["2026-04-22",1,1],["2026-04-25",3,1],["2026-04-28",11,4],["2026-04-30",3,1],
    ["2026-05-02",1,1],["2026-05-05",2,1],["2026-05-06",3,1],["2026-05-07",2,1],["2026-05-08",12,4],["2026-05-09",5,2],["2026-05-10",4,2],["2026-05-11",4,2],["2026-05-19",1,1],["2026-05-20",2,1],["2026-05-27",2,1],["2026-05-28",2,1],["2026-05-29",2,1],["2026-05-30",3,1],
    ["2026-06-06",4,2],["2026-06-07",1,1],["2026-06-08",1,1],["2026-06-10",1,1],["2026-06-11",9,3],["2026-06-13",9,3],["2026-06-14",4,2],["2026-06-15",11,4],
    ["2026-08-16",1,1],["2026-08-18",10,4],["2026-08-19",1,1],["2026-08-20",1,1],
    ["2026-09-02",2,1],["2026-09-03",2,1],["2026-09-06",2,1],["2026-09-14",3,1],["2026-09-16",1,1],["2026-09-17",3,1],["2026-09-21",2,1],["2026-09-22",1,1],["2026-09-23",1,1],["2026-09-24",1,1]
  ]
};

function renderGithubActivity(snapshot) {
  const grid = document.getElementById("github-grid");
  const months = document.getElementById("github-months");
  if (!grid || !months) return;

  const contributions = new Map(snapshot.days.map(([date, count, level]) => [date, { count, level }]));
  grid.replaceChildren();
  months.replaceChildren();
  const start = new Date(snapshot.start + "T00:00:00Z");
  const end = new Date(snapshot.end + "T00:00:00Z");
  const weekStart = new Date(start);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  let weekIndex = 0;

  while (weekStart <= end) {
    const week = document.createElement("div");
    week.className = "github-activity__week";
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = new Date(weekStart);
      date.setUTCDate(date.getUTCDate() + weekday);
      const day = document.createElement("span");
      day.className = "github-activity__day";
      if (date < start || date > end) {
        day.classList.add("github-activity__day--outside");
      } else {
        const dateKey = date.toISOString().slice(0, 10);
        const activity = contributions.get(dateKey) || { count: 0, level: 0 };
        day.dataset.level = String(activity.level);
        day.title = activity.count + (activity.count === 1 ? " contribution" : " contributions") + " on " +
          new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(date);
      }
      week.append(day);

      if (date >= start && date <= end && date.getUTCDate() === 1) {
        const month = document.createElement("span");
        month.textContent = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
        month.style.left = (weekIndex * 12) + "px";
        months.append(month);
      }
    }
    grid.append(week);
    weekStart.setUTCDate(weekStart.getUTCDate() + 7);
    weekIndex++;
  }
  const graphWidth = (weekIndex * 12) + "px";
  grid.style.width = graphWidth;
  months.style.width = graphWidth;
  const total = snapshot.days.reduce((sum, [, count]) => sum + count, 0);
  grid.setAttribute("aria-label", total + " GitHub contributions from " + snapshot.start + " to " + snapshot.end);
  document.querySelector(".github-activity__scroll").setAttribute("aria-label", "GitHub contributions from " + snapshot.start + " to " + snapshot.end);
  document.querySelector(".github-activity__footer strong").textContent = total.toLocaleString("en-GB");
}

renderGithubActivity(githubSnapshot);

async function refreshGithubActivity() {
  try {
    const response = await fetch("https://github-contributions-api.jogruber.de/v4/johanlieber23?y=last");
    if (!response.ok) return;
    const payload = await response.json();
    if (!Array.isArray(payload.contributions) || payload.contributions.length < 350) return;
    const days = payload.contributions
      .filter(({ date, count, level }) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isInteger(count) && count >= 0 && Number.isInteger(level) && level >= 0 && level <= 4)
      .map(({ date, count, level }) => [date, count, level])
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (days.length < 350) return;
    renderGithubActivity({ start: days[0][0], end: days[days.length - 1][0], days });
    document.querySelector(".github-activity__footer > span:last-child").textContent = "Updated from GitHub";
  } catch {
    // Keep the dated snapshot visible when the public API is unavailable.
  }
}

refreshGithubActivity();

