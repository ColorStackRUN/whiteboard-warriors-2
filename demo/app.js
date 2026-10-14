import { createDemoModel, STUDENTS } from "./model.js";

const $ = (selector) => document.querySelector(selector);
let browserStorage = null;
try {
  browserStorage = window.localStorage;
} catch {
  /* Private mode may block storage. */
}
const model = createDemoModel({ storage: browserStorage });
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionToggle = $("#reduce-motion");
motionToggle.checked = motionQuery.matches;
let motionChoice = false;
let selectedScenario = "post";
let trace = [];
let stepIndex = 0;
let playing = false;
let elapsed = 0;
let lastTime = 0;
let frameId = null;
const STEP_MS = 2800;
const packet = $("#packet");
const nodeLabels = {
  website: "WEBSITE",
  backend: "BACKEND",
  database: "DATABASE",
  storage: "FILE STORAGE",
};
const explanations = {
  post: "The photo lives in file storage. The database keeps the listing information and a reference to that photo.",
  search:
    "Basic database search is enough for this small example. A dedicated search service would add coordination and complexity.",
  permission:
    "The backend compares the request’s actor with the stored owner. Hiding a button alone cannot protect a real update.",
};
function updateMotion() {
  document.body.classList.toggle("less-motion", motionToggle.checked);
  renderPacket();
}
motionToggle.addEventListener("change", () => {
  motionChoice = true;
  updateMotion();
});
motionQuery.addEventListener("change", () => {
  if (!motionChoice) {
    motionToggle.checked = motionQuery.matches;
    updateMotion();
  }
});
updateMotion();

function sampleTrace(scenario) {
  // A fresh model keeps the explanatory animation from changing the live demo.
  const sample = createDemoModel({ makeId: () => "walkthrough" });
  if (scenario === "post")
    return sample.create(
      {
        title: "Blue backpack",
        description: "A notebook is inside.",
        location: "Campus courtyard",
        category: "Bags",
      },
      "maya",
    ).trace;
  if (scenario === "search") return sample.search("backpack").trace;
  try {
    sample.markReturned("backpack", "jordan");
  } catch (error) {
    return error.trace;
  }
}
function updatePlayControl() {
  $("#play").textContent = playing
    ? "Pause walkthrough  Ⅱ"
    : stepIndex === trace.length - 1 && elapsed >= STEP_MS
      ? "Replay walkthrough  ▶"
      : "Play walkthrough  ▶";
  $("#play").setAttribute("aria-pressed", String(playing));
}
function setPlaying(value) {
  playing = value;
  updatePlayControl();
  lastTime = 0;
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = playing ? requestAnimationFrame(tick) : null;
}
function setTrace(
  nextTrace,
  {
    autoplay = false,
    message = "No changes to the sample data during this walkthrough.",
  } = {},
) {
  setPlaying(false);
  trace = nextTrace;
  stepIndex = 0;
  elapsed = 0;
  $("#trace-message").textContent = message;
  renderStep();
  if (autoplay) setPlaying(true);
}
function renderStep() {
  const step = trace[stepIndex];
  $("#step-number").textContent = String(stepIndex + 1).padStart(2, "0");
  $("#step-total").textContent = `/ ${String(trace.length).padStart(2, "0")}`;
  $("#component-label").textContent = nodeLabels[step.node];
  $("#step-title").textContent = step.title;
  $("#step-detail").textContent = step.detail;
  $("#map-status").textContent =
    `${nodeLabels[step.node]} · ${step.outcome === "denied" ? "request denied" : step.outcome === "success" ? "response received" : "tracing action"}`;
  document.querySelectorAll(".system-node").forEach((node) => {
    const current = node.dataset.node === step.node;
    node.classList.toggle("current", current);
    node.classList.toggle("denied", current && step.outcome === "denied");
    node.classList.toggle("success", current && step.outcome === "success");
  });
  $("#trace-progress").replaceChildren(
    ...trace.map((_, index) => {
      const segment = document.createElement("span");
      if (index < stepIndex) segment.classList.add("seen");
      if (index === stepIndex) segment.classList.add("current");
      segment.setAttribute("aria-hidden", "true");
      return segment;
    }),
  );
  $("#trace-progress").setAttribute(
    "aria-label",
    `Step ${stepIndex + 1} of ${trace.length}`,
  );
  $("#next").disabled = stepIndex === trace.length - 1;
  updatePlayControl();
  renderPacket();
}
function renderPacket() {
  const step = trace[stepIndex];
  if (!step?.edge || motionToggle.checked) {
    packet.setAttribute("visibility", "hidden");
    return;
  }
  const path = document.getElementById(`edge-${step.edge}`);
  const progress = Math.min(elapsed / 1600, 1);
  const ease = progress * progress * (3 - 2 * progress);
  const point = path.getPointAtLength(path.getTotalLength() * ease);
  packet.setAttribute("visibility", "visible");
  packet.setAttribute("transform", `translate(${point.x} ${point.y})`);
  packet
    .querySelectorAll("circle")
    .forEach((circle, index) =>
      circle.setAttribute(
        "fill",
        step.outcome === "denied" && index < 2
          ? "#ff9eac"
          : index === 2
            ? "#fff"
            : "#8defff",
      ),
    );
}
function tick(time) {
  if (!playing) return;
  if (lastTime) elapsed += Math.min(time - lastTime, 100);
  lastTime = time;
  renderPacket();
  if (elapsed >= STEP_MS) {
    if (stepIndex < trace.length - 1) {
      stepIndex += 1;
      elapsed = 0;
      renderStep();
    } else {
      elapsed = STEP_MS;
      setPlaying(false);
      return;
    }
  }
  frameId = requestAnimationFrame(tick);
}
$("#play").addEventListener("click", () => {
  if (!playing && stepIndex === trace.length - 1 && elapsed >= STEP_MS) {
    stepIndex = 0;
    elapsed = 0;
    renderStep();
  }
  setPlaying(!playing);
  // Keep the complete diagram in view on the workshop's wide-screen display.
  if (window.innerWidth > 780) {
    $(".walkthrough").scrollIntoView({ behavior: "instant", block: "start" });
  }
});
$("#next").addEventListener("click", () => {
  setPlaying(false);
  if (stepIndex < trace.length - 1) {
    stepIndex += 1;
    elapsed = motionToggle.checked ? 0 : 1600;
    renderStep();
  }
});
$("#restart").addEventListener("click", () => {
  setPlaying(false);
  stepIndex = 0;
  elapsed = 0;
  renderStep();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) setPlaying(false);
});
document.querySelectorAll(".scenario").forEach((button) =>
  button.addEventListener("click", () => {
    selectedScenario = button.dataset.scenario;
    document.querySelectorAll(".scenario").forEach((option) => {
      const active = option === button;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", String(active));
    });
    $("#decision-copy").textContent = explanations[selectedScenario];
    setTrace(sampleTrace(selectedScenario));
  }),
);

function appMessage(text, kind = "") {
  $("#app-message").textContent = text;
  $("#app-message").className = `app-message ${kind}`;
}
function element(tag, className, content = "") {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = content;
  return node;
}
function renderListings() {
  const { items } = model.search($("#search").value, $("#status").value);
  const actor = $("#student").value;
  const cards = items.map((item) => {
    const card = element("article", "item-card");
    const image = element("img", "item-image");
    image.src = model.photo(item.photoRef);
    image.alt = `Image for ${item.title}`;
    const caption = element(
      "p",
      "item-image-caption",
      image.getAttribute("src").startsWith("./assets/")
        ? "Sample illustration"
        : "Your uploaded photo · stored in this browser",
    );
    const body = element("div", "item-body");
    const heading = element("div", "item-heading");
    heading.append(
      element("h3", "", item.title),
      element("span", `item-status ${item.status}`, item.status),
    );
    const owner = STUDENTS.find((person) => person.id === item.ownerId).name;
    const action = element(
      "button",
      "secondary item-action",
      item.status === "returned"
        ? "Already returned"
        : item.ownerId === actor
          ? "Mark returned + trace"
          : "Try return as non-owner",
    );
    action.disabled = item.status === "returned";
    action.addEventListener("click", () => returnItem(item.id));
    body.append(
      heading,
      element("p", "item-location", `${item.category} · ${item.location}`),
      element("p", "item-description", item.description),
      element(
        "p",
        "item-owner",
        `Posted by ${owner}${item.ownerId === actor ? " (you, in this demo)" : ""}`,
      ),
      action,
    );
    card.append(image, caption, body);
    return card;
  });
  if (!cards.length) {
    const empty = element("div", "empty-state");
    empty.append(
      element("h3", "", "No matching items"),
      element("p", "", "Try a different word or switch the status filter."),
    );
    cards.push(empty);
  }
  $("#listings").replaceChildren(...cards);
  $("#result-count").textContent =
    `${items.length} ${items.length === 1 ? "listing" : "listings"} · sample data`;
  renderInspector();
}
function renderInspector() {
  const state = model.snapshot();
  $("#record-data").textContent = JSON.stringify(state.listings, null, 2);
  $("#file-data").replaceChildren(
    ...Object.entries(state.files).map(([ref, source]) => {
      const row = element("li", "");
      const image = element("img", "");
      image.src = source;
      image.alt = "";
      const label = element(
        "span",
        "",
        `${ref}\n${source.startsWith("./") ? "Sample illustration file" : "Uploaded image data"}`,
      );
      row.append(image, label);
      return row;
    }),
  );
}
function traceLive(result, scenario, message) {
  selectedScenario = scenario;
  document.querySelectorAll(".scenario").forEach((button) => {
    const active = button.dataset.scenario === scenario;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#decision-copy").textContent = explanations[scenario];
  setTrace(result.trace, { autoplay: !motionToggle.checked, message });
  $(".walkthrough").scrollIntoView({
    behavior: motionToggle.checked ? "instant" : "smooth",
    block: "start",
  });
}
function returnItem(id) {
  try {
    const result = model.markReturned(id, $("#student").value);
    renderListings();
    appMessage(
      "Marked returned. Follow the owner check and saved update above.",
      "success",
    );
    traceLive(
      result,
      "permission",
      "The demo record now has status: returned.",
    );
  } catch (error) {
    appMessage(error.message, "error");
    if (error.trace?.length)
      traceLive(
        error,
        "permission",
        "Permission denied. The demo record did not change.",
      );
  }
}
$("#search").addEventListener("input", renderListings);
$("#status").addEventListener("change", renderListings);
$("#student").addEventListener("change", () => {
  renderListings();
  appMessage(
    `Acting as ${STUDENTS.find((person) => person.id === $("#student").value).name}. This switch is a teaching control, not real sign-in.`,
  );
});
$("#trace-search").addEventListener("click", () => {
  const result = model.search($("#search").value, $("#status").value);
  traceLive(
    result,
    "search",
    `This trace explains the current search. ${result.items.length} matching listings.`,
  );
});
$("#inspect-toggle").addEventListener("click", () => {
  const expanded =
    $("#inspect-toggle").getAttribute("aria-expanded") !== "true";
  $("#inspect-toggle").setAttribute("aria-expanded", String(expanded));
  $("#data-inspector").hidden = !expanded;
});
$("#reset-data").addEventListener("click", () => {
  $("#reset-dialog").showModal();
});
$("#cancel-reset").addEventListener("click", () => $("#reset-dialog").close());
$("#confirm-reset").addEventListener("click", () => {
  try {
    model.reset();
    $("#search").value = "";
    $("#status").value = "all";
    renderListings();
    setTrace(sampleTrace(selectedScenario));
    appMessage(
      "Sample items restored. Your added demo items and photos were removed from this browser.",
      "success",
    );
    $("#reset-dialog").close();
  } catch (error) {
    appMessage(error.message, "error");
  }
});

const dialog = $("#post-dialog");
$("#open-post").addEventListener("click", () => {
  $("#post-person").textContent = STUDENTS.find(
    (person) => person.id === $("#student").value,
  ).name.toUpperCase();
  $("#form-error").textContent = "";
  dialog.showModal();
});
$("#close-post").addEventListener("click", () => dialog.close());
$("#post-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = $("#post-form button[type=submit]");
  submit.disabled = true;
  $("#form-error").textContent = "";
  try {
    const form = new FormData(event.currentTarget);
    const file = $("#photo-upload").files[0];
    let photo;
    if (file) {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 2 * 1024 * 1024
      )
        throw new Error("Choose a PNG, JPEG, or WebP photo up to 2 MB.");
      photo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () =>
          reject(new Error("This photo could not be read. Try another file."));
        reader.readAsDataURL(file);
      });
      const image = new Image();
      image.src = photo;
      try {
        await image.decode();
      } catch {
        throw new Error(
          "This file is not a readable image. Choose another photo.",
        );
      }
    }
    const result = model.create(
      {
        title: form.get("title"),
        description: form.get("description"),
        location: form.get("location"),
        category: form.get("category"),
        photo,
      },
      $("#student").value,
    );
    $("#search").value = "";
    $("#status").value = "all";
    renderListings();
    dialog.close();
    $("#post-form").reset();
    appMessage(
      "Item saved in this browser. Follow the posting flow above.",
      "success",
    );
    traceLive(
      result,
      "post",
      "Your demo item and photo are saved in this browser.",
    );
  } catch (error) {
    $("#form-error").textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});

setTrace(sampleTrace("post"));
renderListings();
if (model.restoreWarning) appMessage(model.restoreWarning);
if (!browserStorage)
  appMessage(
    "Browser storage is unavailable. The demo works, but changes will disappear when you reload.",
  );
