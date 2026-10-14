// Teaching model only: these logical components all run inside one browser.
export const STUDENTS = Object.freeze([
  { id: "maya", name: "Maya" },
  { id: "jordan", name: "Jordan" },
]);
export const CATEGORIES = Object.freeze([
  "Bags",
  "Bottles",
  "Keys",
  "Electronics",
  "Other",
]);
export const STORAGE_KEY = "ww2-lost-found-v1";
const SAMPLE_FILES = Object.freeze({
  backpack: "./assets/backpack.svg",
  bottle: "./assets/bottle.svg",
  keys: "./assets/keys.svg",
});
const event = (node, title, detail, edge = null, outcome = "normal") => ({
  node,
  title,
  detail,
  edge,
  outcome,
});
const clone = (value) => JSON.parse(JSON.stringify(value));
export class DemoError extends Error {
  constructor(message, code, trace = []) {
    super(message);
    this.code = code;
    this.trace = trace;
  }
}
export function seedState() {
  return {
    version: 1,
    listings: [
      {
        id: "backpack",
        title: "Blue backpack",
        description: "Found beside a bench. A notebook is inside.",
        category: "Bags",
        location: "Campus courtyard",
        ownerId: "maya",
        status: "found",
        photoRef: "sample-backpack",
      },
      {
        id: "bottle",
        title: "Water bottle",
        description: "Silver bottle with a blue lid.",
        category: "Bottles",
        location: "Library entrance",
        ownerId: "jordan",
        status: "found",
        photoRef: "sample-bottle",
      },
      {
        id: "keys",
        title: "A set of keys",
        description: "Two keys on a round blue keyring.",
        category: "Keys",
        location: "Student lounge",
        ownerId: "maya",
        status: "returned",
        photoRef: "sample-keys",
      },
    ],
    files: {
      "sample-backpack": SAMPLE_FILES.backpack,
      "sample-bottle": SAMPLE_FILES.bottle,
      "sample-keys": SAMPLE_FILES.keys,
    },
  };
}
function photoIsValid(value) {
  return (
    Object.values(SAMPLE_FILES).includes(value) ||
    (typeof value === "string" &&
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value) &&
      value.length <= 2_800_000)
  );
}
function clean(value, field, min, max) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new DemoError(
      `${field} must be ${min}–${max} characters.`,
      "VALIDATION",
    );
  return value.trim();
}
function student(id) {
  if (!STUDENTS.some((person) => person.id === id))
    throw new DemoError("Choose a sample student.", "IDENTITY");
}
function validState(candidate) {
  if (
    !candidate ||
    candidate.version !== 1 ||
    !Array.isArray(candidate.listings) ||
    !candidate.files ||
    typeof candidate.files !== "object" ||
    Array.isArray(candidate.files)
  )
    return false;
  const ids = new Set();
  return (
    candidate.listings.length <= 100 &&
    candidate.listings.every((item) => {
      try {
        clean(item.id, "ID", 1, 100);
        clean(item.photoRef, "Photo reference", 1, 100);
        clean(item.title, "Title", 3, 80);
        clean(item.description, "Description", 5, 400);
        clean(item.location, "Location", 2, 80);
        student(item.ownerId);
        if (ids.has(item.id)) return false;
        ids.add(item.id);
        return (
          CATEGORIES.includes(item.category) &&
          ["found", "returned"].includes(item.status) &&
          Object.hasOwn(candidate.files, item.photoRef) &&
          photoIsValid(candidate.files[item.photoRef])
        );
      } catch {
        return false;
      }
    })
  );
}
export function createDemoModel({
  storage = null,
  makeId = () => crypto.randomUUID(),
} = {}) {
  let state = seedState();
  let restoreWarning = "";
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (validState(parsed)) state = parsed;
      else
        restoreWarning =
          "Saved demo data was invalid. Showing fresh sample items.";
    }
  } catch {
    restoreWarning = "Saved demo data could not be read. Showing sample items.";
  }
  function commit(next) {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new DemoError(
        "This browser could not save the demo. Try a smaller photo or reset the sample data.",
        "STORAGE",
      );
    }
    state = next;
  }
  return {
    restoreWarning,
    snapshot: () => clone(state),
    photo: (ref) => (Object.hasOwn(state.files, ref) ? state.files[ref] : null),
    reset() {
      commit(seedState());
    },
    create(input, actorId) {
      student(actorId);
      const title = clean(input.title, "Title", 3, 80);
      const description = clean(input.description, "Description", 5, 400);
      const location = clean(input.location, "Location", 2, 80);
      if (!CATEGORIES.includes(input.category))
        throw new DemoError("Choose a listed category.", "VALIDATION");
      const photo = input.photo || SAMPLE_FILES.backpack;
      if (!photoIsValid(photo))
        throw new DemoError(
          "Use a PNG, JPEG, or WebP photo up to 2 MB, or the sample illustration.",
          "VALIDATION",
        );
      if (state.listings.length >= 100)
        throw new DemoError(
          "Demo limit reached. Reset the sample data to keep exploring.",
          "VALIDATION",
        );
      const id = makeId();
      if (state.listings.some((item) => item.id === id))
        throw new DemoError("Please try posting again.", "CONFLICT");
      const photoRef = `photo-${id}`;
      const listing = {
        id,
        title,
        description,
        category: input.category,
        location,
        ownerId: actorId,
        status: "found",
        photoRef,
      };
      const next = clone(state);
      next.files[photoRef] = photo;
      next.listings.unshift(listing);
      // Save one envelope so a failed save cannot leave a partial record/photo.
      commit(next);
      return {
        listing: clone(listing),
        trace: [
          event(
            "website",
            "A student posts a found item",
            `${title}: description, category, location, and a photo.`,
          ),
          event(
            "backend",
            "The website sends an API request",
            "The backend checks the submitted fields and sample student.",
            "request",
          ),
          event(
            "storage",
            "Save the photo separately",
            "File storage holds the image. It returns a photo reference.",
            "photo-write",
          ),
          event(
            "backend",
            "Keep the photo reference",
            "The backend connects the uploaded file to the listing.",
            "photo-read",
          ),
          event(
            "database",
            "Save the listing record",
            "Store description, category, owner, status, and photoRef. The image bytes stay out of the record.",
            "record-write",
          ),
          event(
            "backend",
            "The record is ready",
            "The database returns the new listing.",
            "record-read",
          ),
          event(
            "website",
            "Show the new listing",
            "The API response lets the website display the saved item and its image.",
            "response",
            "success",
          ),
        ],
      };
    },
    search(query = "", status = "all") {
      if (
        typeof query !== "string" ||
        query.length > 120 ||
        !["all", "found", "returned"].includes(status)
      )
        throw new DemoError(
          "Enter a search up to 120 characters and a valid status.",
          "VALIDATION",
        );
      const term = query.trim().toLowerCase();
      const items = state.listings.filter(
        (item) =>
          (status === "all" || item.status === status) &&
          `${item.title} ${item.description} ${item.category} ${item.location}`
            .toLowerCase()
            .includes(term),
      );
      return {
        items: clone(items),
        trace: [
          event(
            "website",
            "Another student searches",
            term
              ? `Search for “${query.trim()}”.`
              : "Browse every sample listing.",
          ),
          event(
            "backend",
            "Send the search to the backend",
            "The website asks for matching listings through an API.",
            "request",
          ),
          event(
            "database",
            "Search the stored records",
            "Start with a basic case-insensitive text match and status filter.",
            "record-write",
          ),
          event(
            "backend",
            `${items.length} matching ${items.length === 1 ? "record" : "records"}`,
            "The results include photo references, not image bytes.",
            "record-read",
          ),
          event(
            "storage",
            "Look up the referenced images",
            "The simulated backend resolves the stored photo references.",
            "photo-write",
          ),
          event(
            "backend",
            "Prepare the results",
            "Combine listing details with their displayable images.",
            "photo-read",
          ),
          event(
            "website",
            "Display the search results",
            "Students can browse the matching items.",
            "response",
            "success",
          ),
        ],
      };
    },
    markReturned(id, actorId) {
      student(actorId);
      const item = state.listings.find((listing) => listing.id === id);
      if (!item)
        throw new DemoError("That listing no longer exists.", "NOT_FOUND");
      const trace = [
        event(
          "website",
          "Request “Mark returned”",
          `${STUDENTS.find((person) => person.id === actorId).name} tries to update “${item.title}”.`,
        ),
        event(
          "backend",
          "Check permission in the backend",
          "The sample actor must match the listing’s stored owner.",
          "request",
        ),
        event(
          "database",
          "Read the listing owner",
          `This record belongs to ${STUDENTS.find((person) => person.id === item.ownerId).name}.`,
          "record-write",
        ),
        event(
          "backend",
          "Compare actor and owner",
          "A button on the website is not the permission check.",
          "record-read",
        ),
      ];
      if (item.ownerId !== actorId) {
        trace.push(
          event(
            "website",
            "403: permission denied",
            "The simulated backend refuses the update. The record stays unchanged.",
            "response",
            "denied",
          ),
        );
        throw new DemoError(
          "Only the student who posted this item can mark it returned.",
          "FORBIDDEN",
          trace,
        );
      }
      const next = clone(state);
      next.listings.find((listing) => listing.id === id).status = "returned";
      commit(next);
      trace.push(
        event(
          "database",
          "Update the status",
          "Change found to returned. Keep the item’s other information.",
          "record-write",
        ),
      );
      trace.push(
        event(
          "backend",
          "Confirm the update",
          "The database saves the status change.",
          "record-read",
        ),
      );
      trace.push(
        event(
          "website",
          "Show “Returned”",
          "The website receives the successful response.",
          "response",
          "success",
        ),
      );
      return { listing: { ...clone(item), status: "returned" }, trace };
    },
  };
}
