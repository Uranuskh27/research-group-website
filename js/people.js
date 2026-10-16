const SECTION_ORDER = [
  {
    key: "professor",
    label: "Professor",
    id: "PrincipalInvestigator",
    aliases: ["professor"],
  },
  {
    key: "phd",
    label: "PhD Students",
    id: "phd",
    aliases: ["phd", "phd student", "phd students"],
  },
  {
    key: "masters",
    label: "Master's Student",
    id: "masters",
    aliases: ["ms", "master", "masters", "master's student", "masters student"],
  },
  {
    key: "undergrad",
    label: "Undergraduate Student",
    id: "undergrad",
    aliases: ["ud", "undergrad", "undergraduate", "undergraduate student"],
  },
  {
    key: "graduate-alumni",
    label: "Graduate Alumni",
    id: "graduate-alumni",
    aliases: ["graduate alu", "graduate alumni", "grad alumni"],
  },
  {
    key: "undergraduate-alumni",
    label: "Undergraduate Alumni",
    id: "undergraduate-alumni",
    aliases: ["ud alu", "undergraduate alu", "undergraduate alumni", "undergrad alumni"],
  },
];

const SECTION_BY_ALIAS = SECTION_ORDER.reduce((sections, section) => {
  section.aliases.forEach((alias) => sections.set(normalizeSectionName(alias), section));
  return sections;
}, new Map());

const DEFAULT_PERSON_IMAGE = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

const root = document.querySelector("[data-people-source], [data-people-sources]");

if (root) {
  loadPeople(root);
}

async function loadPeople(container) {
  try {
    const sources = getPeopleSources(container);

    if (!sources.length) {
      throw new Error("No people data source configured.");
    }

    const csvFiles = await Promise.all(sources.map(fetchPeopleCsv));
    const rows = csvFiles
      .flatMap((csv) => parseCsv(csv))
      .filter((row) => row.active.toUpperCase() !== "FALSE")
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));

    renderPeople(container, rows);
  } catch (error) {
    container.innerHTML = '<p class="main-page-font-size">Unable to load lab members.</p>';
    console.error(error);
  }
}

function getPeopleSources(container) {
  const sources = container.dataset.peopleSources || container.dataset.peopleSource || "";
  return sources
    .split(/\s+/)
    .map((source) => source.trim())
    .filter(Boolean);
}

async function fetchPeopleCsv(source) {
  const response = await fetch(source, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Unable to load people data: ${response.status}`);
  }

  return response.text();
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])));
}

function renderPeople(container, people) {
  const sections = groupBySection(people);
  container.innerHTML = "";

  for (const section of SECTION_ORDER) {
    const sectionGroup = sections.get(section.key);
    if (!sectionGroup || !sectionGroup.members.length) {
      continue;
    }

    appendPeopleSection(container, section.label, section.id, sectionGroup.members);
  }

  for (const [sectionKey, section] of sections) {
    if (SECTION_ORDER.some((orderedSection) => orderedSection.key === sectionKey)) {
      continue;
    }

    appendPeopleSection(container, section.label, slugify(section.label), section.members);
  }
}

function appendPeopleSection(container, section, id, members) {
    const sectionElement = document.createElement("div");
    sectionElement.id = id;

    const heading = document.createElement("h1");
    heading.className = "project";
    heading.textContent = section;

    const grid = document.createElement("div");
    grid.className = "people-grid";

    members.forEach((member) => grid.appendChild(createPersonCard(member)));
    sectionElement.append(heading, grid);
    container.appendChild(sectionElement);
}

function groupBySection(people) {
  const grouped = new Map();

  for (const person of people) {
    const section = getSectionConfig(person.section);
    if (!grouped.has(section.key)) {
      grouped.set(section.key, { label: section.label, members: [] });
    }
    grouped.get(section.key).members.push(person);
  }

  for (const section of grouped.values()) {
    section.members.sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  }

  return grouped;
}

function getSectionConfig(sectionName) {
  const normalized = normalizeSectionName(sectionName);
  return SECTION_BY_ALIAS.get(normalized) || {
    key: normalized || "other",
    label: sectionName || "Other",
  };
}

function normalizeSectionName(sectionName) {
  return String(sectionName || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function createPersonCard(person) {
  const card = document.createElement("div");
  card.className = "person-card";

  const image = document.createElement("img");
  image.className = "person-photo";
  image.src = getPersonImageUrl(person.image);
  image.alt = person.alt || person.name;
  image.loading = "lazy";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", () => {
    if (image.src !== DEFAULT_PERSON_IMAGE) {
      image.src = DEFAULT_PERSON_IMAGE;
    }
  });
  if (person.name === "Hussain Al-Asaad") {
    image.id = "alasaad-photo";
  }

  const name = document.createElement("h2");
  name.textContent = person.name;

  const role = document.createElement("p");
  role.className = "student-title-position";
  role.textContent = person.role;

  const links = document.createElement("div");
  links.className = "social-icons";
  addEmailLink(links, person);
  addIconLink(links, person.linkedin, "linkedin", "LinkedIn", "fab fa-linkedin");
  addIconLink(links, person.github, "github", "GitHub", "fab fa-github");
  addScholarLink(links, person.scholar);
  addIconLink(links, person.cv, "cv", "Curriculum Vitae", "far fa-file-alt");

  card.append(image, name, role, links);
  return card;
}

function getPersonImageUrl(imageUrl) {
  if (!imageUrl) {
    return DEFAULT_PERSON_IMAGE;
  }

  const driveFileId = getGoogleDriveFileId(imageUrl);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w600`;
  }

  return sanitizeWebUrl(imageUrl) || DEFAULT_PERSON_IMAGE;
}

function getGoogleDriveFileId(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("drive.google.com")) {
      return "";
    }

    const filePathMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (filePathMatch) {
      return filePathMatch[1];
    }

    return parsed.searchParams.get("id") || "";
  } catch (error) {
    return "";
  }
}

function addEmailLink(container, person) {
  if (!person.email_user || !person.email_domain || !person.email_tld) {
    return;
  }

  const link = document.createElement("a");
  link.href = "#";
  link.className = "social email";
  link.ariaLabel = "Gmail";
  link.dataset.emailUser = person.email_user;
  link.dataset.emailDomain = person.email_domain;
  link.dataset.emailTld = person.email_tld;
  link.style.color = "#3e3d3d";
  link.style.textDecoration = "none";
  link.innerHTML = '<i class="far fa-envelope"></i>';
  container.appendChild(link);
}

function addIconLink(container, href, className, label, iconClass) {
  const safeHref = sanitizeWebUrl(href);
  if (!safeHref) {
    return;
  }

  const link = document.createElement("a");
  link.href = safeHref;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = `social ${className}`;
  link.ariaLabel = label;
  link.innerHTML = `<i class="${iconClass}"></i>`;
  container.appendChild(link);
}

function addScholarLink(container, href) {
  const safeHref = sanitizeWebUrl(href);
  if (!safeHref) {
    return;
  }

  const link = document.createElement("a");
  link.href = safeHref;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "social scholar";
  link.ariaLabel = "Google Scholar";
  const icon = document.createElement("img");
  icon.src = "https://www.svgrepo.com/show/349396/google-scholar.svg";
  icon.alt = "Google Scholar";
  icon.className = "scholar-icon";
  icon.referrerPolicy = "no-referrer";
  link.appendChild(icon);
  container.appendChild(link);
}

function sanitizeWebUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch (error) {
    return "";
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
