const GOOGLE_SCRIPT_URL = "COLE_A_URL_DO_WEB_APP_AQUI";
const PARTY_ADDRESS = "Rua do Areal, 145 | Camaçari - BA";
const SOURCE = "convite-guilherme-1-ano";
const DEFAULT_CATEGORY = "adulto";
const CATEGORY_OPTIONS = [
  { value: "adulto", label: "Adulto" },
  { value: "adolescente", label: "Adolescente" },
  { value: "crianca", label: "Criança/Bebê" },
];
const CATEGORY_ALIASES = {
  adulto: "adulto",
  adulta: "adulto",
  adolescente: "adolescente",
  teen: "adolescente",
  crianca: "crianca",
  criancas: "crianca",
  crianca_bebe: "crianca",
  bebe: "crianca",
  bebes: "crianca",
  baby: "crianca",
  child: "crianca",
};
const RESERVED_URL_KEYS = new Set(["status", "source", "origem", "ref", "v", "version", "cache", "fbclid", "gclid"]);

const guests = parseGuestsFromUrl();
if (guests.length === 0) guests.push(createGuest());

const guestList = document.querySelector("#guestList");
const addGuestButton = document.querySelector("#addGuest");
const form = document.querySelector("#rsvpForm");
const formMessage = document.querySelector("#formMessage");
const submitButton = document.querySelector("#submitButton");
const submitLabel = document.querySelector("#submitLabel");
const copyButton = document.querySelector("#copyAddress");
const toast = document.querySelector("#toast");
const reservationStatusError = document.querySelector("#reservationStatusError");
const audio = document.querySelector("#backgroundAudio");
const audioToggle = document.querySelector("#audioToggle");
const audioLabel = document.querySelector("#audioLabel");

audio.volume = 0.25;
let toastTimer;
let audioUnlockBound = false;

function setAudioState(isPlaying) {
  audioToggle.setAttribute("aria-pressed", String(isPlaying));
  audioLabel.textContent = isPlaying ? "Pausar música" : "Tocar música";
}

function bindAudioUnlock() {
  if (audioUnlockBound) return;
  audioUnlockBound = true;

  const unlock = () => {
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
    audioUnlockBound = false;
    tryPlayAudio(false);
  };

  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
}

async function tryPlayAudio(bindUnlock = true) {
  try {
    audio.volume = 0.25;
    await audio.play();
    setAudioState(true);
  } catch {
    setAudioState(false);
    if (bindUnlock) bindAudioUnlock();
  }
}

function createGuest(name = "", category = DEFAULT_CATEGORY) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    category: normalizeCategory(category),
  };
}

function normalizeToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeCategory(value) {
  return CATEGORY_ALIASES[normalizeToken(value)] || DEFAULT_CATEGORY;
}

function getCategoryLabel(value) {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.label || CATEGORY_OPTIONS[0].label;
}

function splitGuestList(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseGuestToken(value) {
  const token = String(value || "").replace(/\+/g, " ").trim();
  if (!token) return null;

  const separatorIndex = Math.max(token.lastIndexOf("|"), token.lastIndexOf(":"));
  if (separatorIndex > -1) {
    const possibleCategory = token.slice(separatorIndex + 1).trim();
    const normalizedCategory = normalizeCategory(possibleCategory);

    if (possibleCategory && CATEGORY_ALIASES[normalizeToken(possibleCategory)]) {
      return {
        name: token.slice(0, separatorIndex).trim(),
        category: normalizedCategory,
      };
    }
  }

  return {
    name: token,
    category: DEFAULT_CATEGORY,
  };
}

function parseGuestsFromUrl() {
  if (!window.location.search) return [];

  const params = new URLSearchParams(window.location.search);
  const rawGuests = [];

  params.getAll("convidados").forEach((value) => {
    rawGuests.push(...splitGuestList(value));
  });

  params.forEach((value, key) => {
    if (key === "convidados") return;
    if (RESERVED_URL_KEYS.has(normalizeToken(key)) || normalizeToken(key).startsWith("utm_")) return;

    if (value) {
      rawGuests.push(`${key}|${value}`);
      return;
    }

    rawGuests.push(key);
  });

  return rawGuests
    .map(parseGuestToken)
    .filter((guest) => guest && guest.name)
    .map((guest) => createGuest(guest.name, guest.category));
}

function renderGuests() {
  guestList.innerHTML = "";

  guests.forEach((guest, index) => {
    const block = document.createElement("div");
    block.className = index > 0 ? "guest-block guest-block-extra" : "guest-block";
    block.dataset.guestId = guest.id;

    block.innerHTML = `
      ${index > 0 ? `
        <div class="guest-head">
          <button class="remove-guest" type="button" data-remove-guest aria-label="Remover convidado ${index + 1}">
            <img src="assets/images/close-mark.svg" alt="" aria-hidden="true">
          </button>
        </div>
      ` : ""}
      <div class="guest-fields">
        <div class="name-field">
          <label for="name-${guest.id}">Nome do convidado</label>
          <input id="name-${guest.id}" name="name-${guest.id}" type="text" autocomplete="name" placeholder="Preencha seu nome" value="${escapeHtml(guest.name)}">
          <div class="field-error" id="error-name-${guest.id}" aria-live="polite"></div>
        </div>

        <div class="category-field">
          <span class="category-label" id="category-label-${guest.id}">Perfil</span>
          <div class="category-options" role="radiogroup" aria-labelledby="category-label-${guest.id}">
            ${CATEGORY_OPTIONS.map((option) => `
              <label class="category-option">
                <input type="radio" name="category-${guest.id}" value="${option.value}" ${guest.category === option.value ? "checked" : ""}>
                <span>${option.label}</span>
              </label>
            `).join("")}
          </div>
          <div class="field-error" id="error-category-${guest.id}" aria-live="polite"></div>
        </div>
      </div>
    `;

    guestList.appendChild(block);
  });

  if (guests.length === 1) {
    const placeholder = document.createElement("div");
    placeholder.className = "guest-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.innerHTML = `
      <div class="placeholder-name">Nome do convidado</div>
      <div class="placeholder-category">Adulto / Adolescente / Bebê</div>
    `;
    guestList.appendChild(placeholder);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function findGuest(id) {
  return guests.find((guest) => guest.id === id);
}

function setMessage(text, type = "") {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`.trim();
}

function showToast(text) {
  clearTimeout(toastTimer);
  toast.textContent = text;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
  document.querySelectorAll("[aria-invalid='true']").forEach((node) => {
    node.removeAttribute("aria-invalid");
  });
}

function getReservationStatus() {
  return form.querySelector("input[name='reservation-status']:checked")?.value || "";
}

function validateGuests() {
  clearFieldErrors();
  const errors = [];
  const reservationStatus = getReservationStatus();

  if (!reservationStatus) {
    errors.push("Selecione o status da reserva.");
    reservationStatusError.textContent = "Escolha Eu vou ou Não vou.";
  }

  guests.forEach((guest) => {
    const block = [...document.querySelectorAll(".guest-block")].find((node) => node.dataset.guestId === guest.id);
    const nameInput = block.querySelector("input[type='text']");
    const categoryInput = block.querySelector("input[type='radio']:checked");
    const name = nameInput.value.trim();

    guest.name = name;
    guest.category = normalizeCategory(categoryInput?.value);

    if (!name) {
      errors.push("Informe o nome de todos os convidados.");
      nameInput.setAttribute("aria-invalid", "true");
      document.querySelector(`#error-name-${CSS.escape(guest.id)}`).textContent = "Nome obrigatório.";
    }

    if (!categoryInput) {
      errors.push("Informe o perfil de todos os convidados.");
      block.querySelector(".category-options").setAttribute("aria-invalid", "true");
      document.querySelector(`#error-category-${CSS.escape(guest.id)}`).textContent = "Perfil obrigatório.";
    }
  });

  return [...new Set(errors)];
}

function buildPayload() {
  const reservationStatus = getReservationStatus();

  return {
    submittedAt: new Date().toISOString(),
    guests: guests.map((guest) => ({
      name: guest.name,
      age: getCategoryLabel(guest.category),
      ageCategory: guest.category,
      status: reservationStatus,
    })),
    source: SOURCE,
  };
}

guestList.addEventListener("input", (event) => {
  const block = event.target.closest(".guest-block");
  if (!block) return;
  const guest = findGuest(block.dataset.guestId);
  if (!guest) return;

  if (event.target.matches("input[type='text']")) {
    guest.name = event.target.value;
  }
});

guestList.addEventListener("change", (event) => {
  const block = event.target.closest(".guest-block");
  const guest = block ? findGuest(block.dataset.guestId) : null;

  if (guest && event.target.matches("input[type='radio']")) {
    guest.category = normalizeCategory(event.target.value);
  }

  if (event.target.matches("input")) setMessage("");
});

guestList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-guest]");
  if (removeButton) {
    const block = removeButton.closest(".guest-block");
    const guestIndex = guests.findIndex((guest) => guest.id === block.dataset.guestId);

    if (guestIndex > 0) {
      guests.splice(guestIndex, 1);
      renderGuests();
      setMessage("");
    }
    return;
  }

});

addGuestButton.addEventListener("click", () => {
  guests.push(createGuest());
  renderGuests();
  setMessage("");
  const lastGuest = guests[guests.length - 1];
  document.querySelector(`#name-${CSS.escape(lastGuest.id)}`).focus();
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(PARTY_ADDRESS);
    showToast("Endereço copiado!");
  } catch {
    const helper = document.createElement("textarea");
    helper.value = PARTY_ADDRESS;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    showToast("Endereço copiado!");
  }
});

form.addEventListener("change", (event) => {
  if (event.target.matches("input[name='reservation-status']")) {
    reservationStatusError.textContent = "";
    setMessage("");
  }
});

audioToggle.addEventListener("click", async () => {
  if (!audio.paused) {
    audio.pause();
    setAudioState(false);
    return;
  }

  try {
    await audio.play();
    setAudioState(true);
  } catch {
    setAudioState(false);
    audioLabel.textContent = "Áudio indisponível";
  }
});

audio.addEventListener("play", () => setAudioState(true));
audio.addEventListener("pause", () => setAudioState(false));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");

  const validationErrors = validateGuests();
  if (validationErrors.length > 0) {
    setMessage(validationErrors.join(" "), "error");
    return;
  }

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "COLE_A_URL_DO_WEB_APP_AQUI") {
    setMessage("Configure a URL do Google Apps Script em script.js antes de enviar.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitLabel.textContent = "Enviando...";

  try {
    const payload = buildPayload();

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    sessionStorage.setItem("conviteGuilhermeLastGuests", JSON.stringify(payload.guests));
    window.location.href = "obrigado.html";
  } catch {
    setMessage("Não foi possível enviar agora. Tente novamente em instantes.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.setAttribute("aria-busy", "false");
    submitLabel.textContent = "Enviar Confirmação";
  }
});

renderGuests();
tryPlayAudio();
