(() => {
  const section = document.getElementById("projects");
  const grid = section.querySelector(".project-list");
  const projects = Array.from(grid.querySelectorAll("article.project"), (card) => ({
    card,
    title: card.querySelector("h3").textContent,
    category: card.querySelector(".project__top span").textContent,
  }));
  const layout = new URLSearchParams(location.search).get("projects");
  if (layout === "grid") {
    // The three additional projects are inside a disclosure in the original layout.
    const openLinkedProject = () => {
      const project = findLinkedProject();
      const details = project?.card.closest("details");
      if (details) details.open = true;
    };
    openLinkedProject();
    window.addEventListener("hashchange", openLinkedProject);
    return;
  }

  const preview = document.createElement("div");
  preview.className = "project-preview";
  const content = document.createElement("div");
  content.className = "project-preview__content";
  const useIndex = layout !== "accordion" && layout !== "spotlight";

  function findLinkedProject() {
    return projects.find(({ card }) => card.id === location.hash.slice(1));
  }

  function followProjectHash() {
    const project = findLinkedProject();
    if (!project) {
      if (useIndex && (!location.hash || location.hash === "#projects")) reveal(projects[0]);
      return;
    }
    reveal(project);
    if (!useIndex) project.card.scrollIntoView();
  }

  let reveal;
  if (layout === "accordion") {
    preview.classList.add("project-preview--accordion");
    for (const { card, title, category } of projects) {
      const details = document.createElement("details");
      details.className = "project-preview__disclosure";
      details.name = "portfolio-projects";
      const summary = document.createElement("summary");
      const label = document.createElement("span");
      label.textContent = title;
      const tag = document.createElement("small");
      tag.textContent = category;
      summary.append(label, tag);
      details.append(summary, card);
      preview.append(details);
    }
    reveal = ({ card }) => { card.parentElement.open = true; };
  } else {
    content.append(...projects.map(({ card }) => card));

    function showProject(project) {
      for (const item of projects) item.card.hidden = item !== project;
    }

    if (layout === "spotlight") {
      preview.classList.add("project-preview--spotlight");
      const controls = document.createElement("div");
      controls.className = "project-preview__controls";
      const previous = document.createElement("button");
      previous.type = "button";
      previous.textContent = "Previous project";
      const next = document.createElement("button");
      next.type = "button";
      next.textContent = "Next project";
      const position = document.createElement("span");
      position.setAttribute("role", "status");
      const label = document.createElement("span");
      label.className = "project-preview__sr-only";
      let current = 0;
      reveal = (project) => {
        current = projects.indexOf(project);
        showProject(project);
        label.textContent = "Viewing " + project.title + ".";
        position.replaceChildren((current + 1) + " / " + projects.length, label);
      };
      previous.addEventListener("click", () => reveal(projects[(current - 1 + projects.length) % projects.length]));
      next.addEventListener("click", () => reveal(projects[(current + 1) % projects.length]));
      controls.append(previous, position, next);
      preview.append(content, controls);
    } else {
      preview.classList.add("project-preview--index");
      const nav = document.createElement("nav");
      nav.className = "project-preview__navigation";
      nav.setAttribute("aria-label", "Project index");
      const picker = document.createElement("select");
      picker.className = "project-preview__picker";
      picker.setAttribute("aria-label", "Choose a project");

      function chooseProject(project) {
        reveal(project);
        const hash = "#" + project.card.id;
        if (location.hash !== hash) history.pushState(null, "", hash);
      }

      const links = projects.map((project) => {
        const { card, title, category } = project;
        const link = document.createElement("a");
        link.href = "#" + card.id;
        const name = document.createElement("span");
        name.textContent = title;
        const label = document.createElement("small");
        label.textContent = category;
        link.append(name, label);
        link.addEventListener("click", (event) => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          chooseProject(project);
        });
        const option = document.createElement("option");
        option.value = card.id;
        option.textContent = title;
        picker.append(option);
        return link;
      });
      reveal = (project) => {
        showProject(project);
        picker.value = project.card.id;
        links.forEach((link, i) => link.setAttribute("aria-current", projects[i] === project ? "location" : "false"));
      };
      picker.addEventListener("change", () => chooseProject(projects[picker.selectedIndex]));
      nav.append(...links);
      preview.append(nav, picker, content);
    }

    reveal(findLinkedProject() ?? projects[0]);
  }

  grid.replaceWith(preview);
  followProjectHash();
  if (useIndex && findLinkedProject()) section.scrollIntoView();
  window.addEventListener("hashchange", followProjectHash);
  if (useIndex) window.addEventListener("popstate", followProjectHash);
})();
