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

const activityGrid = document.querySelector("#activity-grid");
const activityDays = new Map(githubSnapshot.days.map(([date, count, level]) => [date, { count, level }]));
const firstDay = Date.parse(githubSnapshot.start);
const lastDay = Date.parse(githubSnapshot.end);
const dayLength = 86_400_000;
const startOfWeek = firstDay - new Date(firstDay).getUTCDay() * dayLength;
const cellCount = Math.ceil(((lastDay - startOfWeek) / dayLength + 1) / 7) * 7;
const activityCells = document.createDocumentFragment();
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });

for (let index = 0; index < cellCount; index++) {
  const date = new Date(startOfWeek + index * dayLength);
  const cell = document.createElement("span");
  cell.className = "activity-day";
  if (date >= firstDay && date <= lastDay) {
    const { count, level } = activityDays.get(date.toISOString().slice(0, 10)) ?? { count: 0, level: 0 };
    cell.dataset.level = level;
    cell.title = dateFormat.format(date) + " · " + count + (count === 1 ? " contribution" : " contributions");
  }
  activityCells.append(cell);
}

const total = githubSnapshot.days.reduce((sum, [, count]) => sum + count, 0);
document.querySelector("#activity-total").textContent = total;
activityGrid.setAttribute("aria-label", total + " contributions from " + dateFormat.format(firstDay) + " to " + dateFormat.format(lastDay));
activityGrid.append(activityCells);
const activityScroll = activityGrid.parentElement;
activityScroll.hidden = false;
activityScroll.tabIndex = 0;
activityScroll.setAttribute("role", "region");
activityScroll.setAttribute("aria-label", "GitHub contribution heatmap");


