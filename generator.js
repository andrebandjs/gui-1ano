const DEFAULT_CATEGORY = "adulto";
const CATEGORY_OPTIONS = [
  { value: "adulto", label: "Adulto" },
  { value: "adolescente", label: "Adolescente" },
  { value: "crianca", label: "Criança/Bebê" },
];

const generatorGuests = [createGuest()];
const generatorList = document.querySelector("#generatorList");
const addGeneratorGuest = document.querySelector("#addGeneratorGuest");
const generatorForm = document.querySelector("#generatorForm");
const generatorMessage = document.querySelector("#generatorMessage");
const generatedLinkPanel = document.querySelector("#generatedLinkPanel");
const generatedLink = document.querySelector("#generatedLink");
const copyGeneratedLink = document.querySelector("#copyGeneratedLink");
const openGeneratedLink = document.querySelector("#openGeneratedLink");
const toast = document.querySelector("#toast");

let toastTimer;

function createGuest(name = "", category = DEFAULT_CATEGORY) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    category,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setMessage(text, type = "") {
  generatorMessage.textContent = text;
  generatorMessage.className = `form-message ${type}`.trim();
}

function showToast(text) {
  clearTimeout(toastTimer);
  toast.textContent = text;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function findGuest(id) {
  return generatorGuests.find((guest) => guest.id === id);
}

function renderGuests() {
  generatorList.innerHTML = "";

  generatorGuests.forEach((guest, index) => {
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
          <label for="generator-name-${guest.id}">Nome do convidado</label>
          <input id="generator-name-${guest.id}" type="text" autocomplete="name" placeholder="Preencha o nome" value="${escapeHtml(guest.name)}">
          <div class="field-error" aria-live="polite"></div>
        </div>

        <div class="category-field">
          <span class="category-label" id="generator-category-label-${guest.id}">Perfil</span>
          <div class="category-options" role="radiogroup" aria-labelledby="generator-category-label-${guest.id}">
            ${CATEGORY_OPTIONS.map((option) => `
              <label class="category-option">
                <input type="radio" name="generator-category-${guest.id}" value="${option.value}" ${guest.category === option.value ? "checked" : ""}>
                <span>${option.label}</span>
              </label>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    generatorList.appendChild(block);
  });
}

function clearErrors() {
  generatorList.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
  generatorList.querySelectorAll("[aria-invalid='true']").forEach((node) => {
    node.removeAttribute("aria-invalid");
  });
}

function syncGuestsFromForm() {
  generatorList.querySelectorAll(".guest-block").forEach((block) => {
    const guest = findGuest(block.dataset.guestId);
    if (!guest) return;

    guest.name = block.querySelector("input[type='text']").value.trim();
    guest.category = block.querySelector("input[type='radio']:checked")?.value || DEFAULT_CATEGORY;
  });
}

function validateGuests() {
  clearErrors();
  syncGuestsFromForm();

  const errors = [];
  generatorGuests.forEach((guest) => {
    if (guest.name) return;

    const block = [...generatorList.querySelectorAll(".guest-block")].find((node) => node.dataset.guestId === guest.id);
    const input = block.querySelector("input[type='text']");
    const error = block.querySelector(".field-error");
    input.setAttribute("aria-invalid", "true");
    error.textContent = "Nome obrigatório.";
    errors.push("Informe o nome de todos os convidados.");
  });

  return [...new Set(errors)];
}

function buildInviteUrl() {
  const url = new URL("index.html", window.location.href);
  url.search = "";
  url.hash = "";

  generatorGuests.forEach((guest) => {
    url.searchParams.append("convidados", `${guest.name}|${guest.category}`);
  });

  return url.toString();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
}

generatorList.addEventListener("input", (event) => {
  const block = event.target.closest(".guest-block");
  const guest = block ? findGuest(block.dataset.guestId) : null;
  if (!guest || !event.target.matches("input[type='text']")) return;

  guest.name = event.target.value;
  setMessage("");
});

generatorList.addEventListener("change", (event) => {
  const block = event.target.closest(".guest-block");
  const guest = block ? findGuest(block.dataset.guestId) : null;
  if (!guest || !event.target.matches("input[type='radio']")) return;

  guest.category = event.target.value;
  setMessage("");
});

generatorList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-guest]");
  if (!removeButton) return;

  const block = removeButton.closest(".guest-block");
  const guestIndex = generatorGuests.findIndex((guest) => guest.id === block.dataset.guestId);
  if (guestIndex > 0) {
    generatorGuests.splice(guestIndex, 1);
    renderGuests();
    setMessage("");
  }
});

addGeneratorGuest.addEventListener("click", () => {
  generatorGuests.push(createGuest());
  renderGuests();
  setMessage("");
  generatedLinkPanel.hidden = true;

  const lastGuest = generatorGuests[generatorGuests.length - 1];
  document.querySelector(`#generator-name-${CSS.escape(lastGuest.id)}`).focus();
});

generatorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");

  const errors = validateGuests();
  if (errors.length > 0) {
    setMessage(errors.join(" "), "error");
    generatedLinkPanel.hidden = true;
    return;
  }

  const inviteUrl = buildInviteUrl();
  generatedLink.value = inviteUrl;
  openGeneratedLink.href = inviteUrl;
  generatedLinkPanel.hidden = false;
  await copyText(inviteUrl);
  showToast("Link copiado!");
  setMessage("Link gerado e copiado para a área de transferência.", "success");
});

copyGeneratedLink.addEventListener("click", async () => {
  if (!generatedLink.value) return;
  await copyText(generatedLink.value);
  showToast("Link copiado!");
});

renderGuests();
