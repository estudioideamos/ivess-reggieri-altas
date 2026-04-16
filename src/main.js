const steps = Array.from(document.querySelectorAll(".step"));
const form = document.querySelector("#signup-form");
const formMessage = document.querySelector("#form-message");
const summary = document.querySelector("#summary");
const progressBar = document.querySelector("#progress-bar");
const stepIndex = document.querySelector("#step-index");
const backButton = document.querySelector("#back-button");
const nextButton = document.querySelector("#next-button");
const submitButton = document.querySelector("#submit-button");
const stepperItems = Array.from(document.querySelectorAll("[data-go-step]"));
const planCards = Array.from(document.querySelectorAll(".plan-card"));
const addressInput = document.querySelector("#address");
const cityInput = document.querySelector("#city");
const provinceInput = document.querySelector("#province");
const addressSuggestions = document.querySelector("#address-suggestions");
const nextLabels = [
  "Continuar",
  "Ver entrega",
  "Elegir pedido",
  "Revisar solicitud",
];
const serviceTypeLabels = {
  hogar: "Hogar / departamento",
  empresa: "Empresa / oficina",
  barrio: "Barrio privado",
};
const propertyTypeLabels = {
  casa: "Casa",
  departamento: "Departamento",
  oficina: "Oficina",
  local: "Local comercial",
};
const timeSlotLabels = {
  manana: "Mañana",
  tarde: "Tarde",
  completo: "Horario comercial",
};
const frequencyLabels = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};
const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

let currentStep = 0;
let suggestionItems = [];
let activeSuggestionIndex = -1;
let addressDebounceTimer = null;
let addressAbortController = null;

initializePlanCards();
initializeAddressAutocomplete();
updateAllPlanCards();
renderStep();

stepperItems.forEach((item) => {
  item.addEventListener("click", () => {
    const requestedStep = Number(item.dataset.goStep);

    if (Number.isNaN(requestedStep) || requestedStep === currentStep) {
      return;
    }

    if (requestedStep > currentStep && !validateStep(currentStep)) {
      return;
    }

    currentStep = requestedStep;
    renderStep();
  });
});

backButton.addEventListener("click", () => {
  if (currentStep === 0) {
    return;
  }

  currentStep -= 1;
  renderStep();
});

nextButton.addEventListener("click", () => {
  if (!validateStep(currentStep)) {
    return;
  }

  currentStep += 1;
  renderStep();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateStep(currentStep)) {
    return;
  }

  formMessage.textContent =
    "Solicitud enviada. Nuestro equipo revisará tu pedido y te contactará para confirmar cobertura, propuesta y primera entrega.";
  formMessage.classList.add("is-success");
});

function renderStep() {
  steps.forEach((step, index) => {
    step.classList.toggle("is-active", index === currentStep);
  });

  stepperItems.forEach((item, index) => {
    item.classList.toggle("is-active", index === currentStep);
    item.classList.toggle("is-complete", index < currentStep);
  });

  const progress = ((currentStep + 1) / steps.length) * 100;
  progressBar.style.width = `${progress}%`;
  stepIndex.textContent = String(currentStep + 1);

  backButton.disabled = currentStep === 0;
  nextButton.classList.toggle("is-hidden", currentStep === steps.length - 1);
  submitButton.classList.toggle("is-hidden", currentStep !== steps.length - 1);
  nextButton.textContent = nextLabels[currentStep] || "Continuar";
  submitButton.textContent = "Enviar solicitud";

  updateAllPlanCards();

  if (currentStep === steps.length - 1) {
    renderSummary();
  }

  formMessage.textContent = "";
  formMessage.classList.remove("is-success");
}

function validateStep(stepNumber) {
  const currentSection = steps[stepNumber];
  const fields = Array.from(
    currentSection.querySelectorAll("input, select, textarea"),
  );

  let firstInvalidField = null;

  for (const field of fields) {
    clearFieldError(field);

    if (field.type === "radio") {
      continue;
    }

    if (field.type === "checkbox" && field.required && !field.checked) {
      setFieldError(field, "Este campo es obligatorio.");
      firstInvalidField ??= field;
      continue;
    }

    if (!field.checkValidity()) {
      setFieldError(field, "Revisa este campo antes de continuar.");
      firstInvalidField ??= field;
      continue;
    }
  }

  if (stepNumber === 1) {
    const areaCode = document.querySelector("#areaCode");
    const phone = document.querySelector("#phone");
    const digits = `${areaCode.value}${phone.value}`.replace(/\D/g, "");

    if (digits.length < 10) {
      setFieldError(phone, "El codigo de area y el celular deben sumar al menos 10 digitos.");
      firstInvalidField ??= phone;
    }
  }

  if (stepNumber === 3) {
    const selectedPlanInput = form.querySelector('input[name="plan"]:checked');
    const selectedQuantityInput = selectedPlanInput
      ?.closest(".plan-card")
      ?.querySelector("[data-qty-input]");

    if (!selectedQuantityInput || getQuantityValue(selectedQuantityInput) < 1) {
      setFieldError(
        selectedQuantityInput,
        "Selecciona al menos una unidad para continuar.",
      );
      firstInvalidField ??= selectedQuantityInput;
    }
  }

  if (firstInvalidField) {
    formMessage.textContent = "Hay campos pendientes o incompletos en este paso.";
    firstInvalidField.focus();
    return false;
  }

  formMessage.textContent = "";
  return true;
}

function renderSummary() {
  const data = getFormData();
  const deliveryLine = [
    getLabel(data.propertyType, propertyTypeLabels),
    getLabel(data.timeSlot, timeSlotLabels),
    getLabel(data.frequency, frequencyLabels),
  ]
    .filter((value) => value && value !== "No informado")
    .join(" · ");
  const referenceLine = data.notes
    ? `
      <div>
        <dt>Acceso / referencias</dt>
        <dd>${escapeHtml(data.notes)}</dd>
      </div>
    `
    : "";

  summary.innerHTML = `
    <dl>
      <div>
        <dt>Tipo de servicio</dt>
        <dd>${getLabel(data.serviceType, serviceTypeLabels)}</dd>
      </div>
      <div>
        <dt>Dirección</dt>
        <dd>${escapeHtml(data.address)}, ${escapeHtml(data.city)}, ${escapeHtml(data.province)}</dd>
      </div>
      <div>
        <dt>Contacto principal</dt>
        <dd>${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</dd>
      </div>
      <div>
        <dt>Canal de respuesta</dt>
        <dd>${escapeHtml(data.areaCode)} ${escapeHtml(data.phone)} · ${escapeHtml(data.email)}</dd>
      </div>
      <div>
        <dt>Entrega</dt>
        <dd>${deliveryLine || "A definir"}</dd>
      </div>
      <div>
        <dt>Pedido inicial</dt>
        <dd>${escapeHtml(data.plan)} x ${data.planQuantity}${data.planPrice ? ` · ${data.planPrice}` : ""}</dd>
      </div>
      ${referenceLine}
    </dl>
  `;
}

function getFormData() {
  const data = new FormData(form);
  const selectedPlanInput = form.querySelector('input[name="plan"]:checked');
  const selectedPlanCard = selectedPlanInput?.closest(".plan-card");
  const selectedQuantityInput = selectedPlanCard?.querySelector("[data-qty-input]");
  const planQuantity = getQuantityValue(selectedQuantityInput);
  const planUnitPrice = Number(selectedPlanInput?.dataset.unitPrice || 0);
  const planTotal = planUnitPrice * planQuantity;

  return {
    serviceType: normalizeValue(data.get("serviceType")),
    address: normalizeValue(data.get("address")),
    city: normalizeValue(data.get("city")),
    province: normalizeValue(data.get("province")),
    firstName: normalizeValue(data.get("firstName")),
    lastName: normalizeValue(data.get("lastName")),
    areaCode: normalizeValue(data.get("areaCode")),
    phone: normalizeValue(data.get("phone")),
    email: normalizeValue(data.get("email")),
    propertyType: normalizeValue(data.get("propertyType")),
    timeSlot: normalizeValue(data.get("timeSlot")),
    frequency: normalizeValue(data.get("frequency")),
    unit: normalizeValue(data.get("unit")),
    notes: normalizeValue(data.get("notes")),
    plan: selectedPlanInput?.dataset.label || normalizeValue(data.get("plan")),
    planQuantity,
    planPrice: planTotal > 0 ? formatCurrency(planTotal) : "",
  };
}

function initializePlanCards() {
  planCards.forEach((card) => {
    const planInput = card.querySelector('input[type="radio"]');
    const quantityInput = card.querySelector("[data-qty-input]");
    const quantityButtons = Array.from(card.querySelectorAll("[data-qty-action]"));

    quantityButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();

        const currentValue = getQuantityValue(quantityInput);
        const delta = button.dataset.qtyAction === "increase" ? 1 : -1;
        quantityInput.value = String(clamp(currentValue + delta, 1, 12));
        planInput.checked = true;
        updateAllPlanCards();
      });
    });

    quantityInput.addEventListener("input", () => {
      quantityInput.value = String(clamp(getQuantityValue(quantityInput), 1, 12));
      planInput.checked = true;
      updateAllPlanCards();
    });

    planInput.addEventListener("change", () => {
      updateAllPlanCards();
    });
  });
}

function updateAllPlanCards() {
  planCards.forEach((card) => {
    const planInput = card.querySelector('input[type="radio"]');
    const quantityInput = card.querySelector("[data-qty-input]");
    const totalOutput = card.querySelector("[data-total-output]");
    const unitPrice = Number(planInput.dataset.unitPrice || 0);
    const quantity = getQuantityValue(quantityInput);

    if (totalOutput) {
      totalOutput.textContent = formatCurrency(unitPrice * quantity);
    }
  });
}

function normalizeValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function setFieldError(field, message) {
  field.setCustomValidity(message);
  field.reportValidity();
}

function clearFieldError(field) {
  field.setCustomValidity("");
}

function getQuantityValue(input) {
  if (!input) {
    return 1;
  }

  const numericValue = Number(input.value);
  return Number.isFinite(numericValue) ? numericValue : 1;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getLabel(value, labels) {
  if (!value) {
    return "No informado";
  }

  return labels[value] || value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function initializeAddressAutocomplete() {
  if (!addressInput || !addressSuggestions) {
    return;
  }

  addressInput.addEventListener("input", () => {
    const query = normalizeValue(addressInput.value);

    clearTimeout(addressDebounceTimer);

    if (query.length < 3) {
      clearAddressSuggestions();
      return;
    }

    addressDebounceTimer = window.setTimeout(() => {
      fetchAddressSuggestions(query);
    }, 260);
  });

  addressInput.addEventListener("keydown", (event) => {
    if (!suggestionItems.length || addressSuggestions.classList.contains("is-hidden")) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestionItems.length;
      updateActiveSuggestion();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      activeSuggestionIndex =
        activeSuggestionIndex <= 0
          ? suggestionItems.length - 1
          : activeSuggestionIndex - 1;
      updateActiveSuggestion();
      return;
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      applyAddressSuggestion(suggestionItems[activeSuggestionIndex]);
      return;
    }

    if (event.key === "Escape") {
      clearAddressSuggestions();
    }
  });

  addressInput.addEventListener("blur", () => {
    window.setTimeout(() => {
      clearAddressSuggestions();
    }, 120);
  });
}

async function fetchAddressSuggestions(query) {
  if (addressAbortController) {
    addressAbortController.abort();
  }

  addressAbortController = new AbortController();

  const endpoint =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=ar&limit=6&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      signal: addressAbortController.signal,
    });

    if (!response.ok) {
      clearAddressSuggestions();
      return;
    }

    const results = await response.json();
    renderAddressSuggestions(Array.isArray(results) ? results : []);
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    clearAddressSuggestions();
  }
}

function renderAddressSuggestions(items) {
  suggestionItems = items;
  activeSuggestionIndex = -1;

  if (!items.length) {
    clearAddressSuggestions();
    return;
  }

  addressSuggestions.innerHTML = items
    .map((item, index) => {
      const addressParts = parseAddressParts(item);

      return `
        <button class="address-suggestions__item" type="button" data-suggestion-index="${index}">
          <span class="address-suggestions__main">${escapeHtml(addressParts.main)}</span>
          <span class="address-suggestions__secondary">${escapeHtml(addressParts.secondary)}</span>
        </button>
      `;
    })
    .join("");

  addressSuggestions.classList.remove("is-hidden");

  Array.from(addressSuggestions.querySelectorAll("[data-suggestion-index]")).forEach(
    (button) => {
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();

        const index = Number(button.dataset.suggestionIndex);
        const selectedItem = suggestionItems[index];

        if (selectedItem) {
          applyAddressSuggestion(selectedItem);
        }
      });
    },
  );
}

function updateActiveSuggestion() {
  const buttons = Array.from(
    addressSuggestions.querySelectorAll("[data-suggestion-index]"),
  );

  buttons.forEach((button, index) => {
    button.classList.toggle("is-active", index === activeSuggestionIndex);
  });
}

function applyAddressSuggestion(item) {
  const addressParts = parseAddressParts(item);

  addressInput.value = addressParts.main;

  if (cityInput && addressParts.city) {
    cityInput.value = addressParts.city;
  }

  if (provinceInput && addressParts.province) {
    provinceInput.value = addressParts.province;
  }

  clearAddressSuggestions();
}

function parseAddressParts(item) {
  const address = item.address || {};
  const street =
    address.road ||
    address.pedestrian ||
    address.residential ||
    address.path ||
    "";
  const number = address.house_number || "";
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.county ||
    "";
  const province = address.state || "";
  const main = [street, number].filter(Boolean).join(" ").trim();

  return {
    main: main || item.display_name.split(",").slice(0, 2).join(",").trim(),
    secondary: [city, province, "Argentina"].filter(Boolean).join(", "),
    city,
    province,
  };
}

function clearAddressSuggestions() {
  suggestionItems = [];
  activeSuggestionIndex = -1;

  if (addressSuggestions) {
    addressSuggestions.innerHTML = "";
    addressSuggestions.classList.add("is-hidden");
  }
}
