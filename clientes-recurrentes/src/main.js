const steps = Array.from(document.querySelectorAll(".step"));
const form = document.querySelector("#reorder-form");
const formMessage = document.querySelector("#form-message");
const summary = document.querySelector("#summary");
const progressBar = document.querySelector("#progress-bar");
const stepIndex = document.querySelector("#step-index");
const backButton = document.querySelector("#back-button");
const nextButton = document.querySelector("#next-button");
const submitButton = document.querySelector("#submit-button");
const stepperItems = Array.from(document.querySelectorAll("[data-go-step]"));
const planCards = Array.from(document.querySelectorAll(".plan-card"));
const lookupAreaCodeInput = document.querySelector("#lookup-area-code");
const lookupPhoneInput = document.querySelector("#lookup-phone");
const lookupButton = document.querySelector("#lookup-button");
const lookupMessage = document.querySelector("#lookup-message");
const customerCard = document.querySelector("#customer-card");
const customerConfirmedInput = document.querySelector("#customer-confirmed");

const customerFirstNameInput = document.querySelector("#customer-first-name");
const customerLastNameInput = document.querySelector("#customer-last-name");
const customerEmailInput = document.querySelector("#customer-email");
const customerAddressInput = document.querySelector("#customer-address");
const customerCityInput = document.querySelector("#customer-city");
const customerProvinceInput = document.querySelector("#customer-province");

const appConfig = window.APP_CONFIG || {};
const customerScriptUrl = normalizeValue(appConfig.customerScriptUrl || "");
const nextLabels = ["Ver productos", "Revisar pedido"];
const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

let currentStep = 0;
let customerData = null;

initializePlanCards();
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

lookupButton.addEventListener("click", () => {
  void handleCustomerLookup();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateStep(currentStep)) {
    return;
  }

  const data = getFormData();
  const submitResult = await sendOrderToAppsScript(data);

  if (!submitResult.ok) {
    formMessage.textContent =
      "No pudimos enviar el pedido en este momento. Intenta nuevamente o revisa la configuracion del Apps Script.";
    formMessage.classList.remove("is-success");
    return;
  }

  formMessage.textContent =
    "Pedido enviado correctamente. El equipo de Ivess Reggieri te va a contactar para confirmar entrega.";
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

  updateAllPlanCards();

  if (currentStep === steps.length - 1) {
    renderSummary();
  }

  formMessage.textContent = "";
  formMessage.classList.remove("is-success");
}

function validateStep(stepNumber) {
  let firstInvalidField = null;

  if (stepNumber === 0) {
    const areaCodeValue = normalizeDigits(lookupAreaCodeInput.value);
    const phoneValue = normalizeDigits(lookupPhoneInput.value);

    if (areaCodeValue.length < 2) {
      setFieldError(lookupAreaCodeInput, "Completa un codigo de area valido.");
      firstInvalidField ??= lookupAreaCodeInput;
    } else {
      clearFieldError(lookupAreaCodeInput);
    }

    if (phoneValue.length < 6) {
      setFieldError(lookupPhoneInput, "Completa un celular valido.");
      firstInvalidField ??= lookupPhoneInput;
    } else {
      clearFieldError(lookupPhoneInput);
    }

    if (!customerData) {
      lookupMessage.textContent = "Busca primero el cliente para continuar.";
      firstInvalidField ??= lookupButton;
    }

    if (customerData && !customerConfirmedInput.checked) {
      setFieldError(customerConfirmedInput, "Confirma los datos del cliente.");
      firstInvalidField ??= customerConfirmedInput;
    } else {
      clearFieldError(customerConfirmedInput);
    }
  }

  if (stepNumber === 1) {
    const selectedPlanInput = form.querySelector('input[name="plan"]:checked');
    const selectedQuantityInput = selectedPlanInput
      ?.closest(".plan-card")
      ?.querySelector("[data-qty-input]");

    if (!selectedQuantityInput || getQuantityValue(selectedQuantityInput) < 1) {
      setFieldError(selectedQuantityInput, "Selecciona al menos una unidad.");
      firstInvalidField ??= selectedQuantityInput;
    }
  }

  if (stepNumber === 2) {
    const termsInput = document.querySelector("#terms");

    if (!termsInput.checked) {
      setFieldError(termsInput, "Debes aceptar para enviar el pedido.");
      firstInvalidField ??= termsInput;
    } else {
      clearFieldError(termsInput);
    }
  }

  if (firstInvalidField) {
    formMessage.textContent = "Hay campos pendientes antes de avanzar.";
    firstInvalidField.focus();
    return false;
  }

  formMessage.textContent = "";
  return true;
}

async function handleCustomerLookup() {
  const areaCodeValue = normalizeDigits(lookupAreaCodeInput.value);
  const phoneValue = normalizeDigits(lookupPhoneInput.value);
  const completePhone = `${areaCodeValue}${phoneValue}`;

  clearFieldError(lookupAreaCodeInput);
  clearFieldError(lookupPhoneInput);
  lookupMessage.classList.remove("is-success");

  if (areaCodeValue.length < 2 || phoneValue.length < 6) {
    lookupMessage.textContent = "Ingresa codigo de area y celular para buscar.";
    return;
  }

  if (!customerScriptUrl) {
    lookupMessage.textContent = "Falta configurar la URL de Apps Script para buscar clientes.";
    return;
  }

  lookupButton.disabled = true;
  lookupButton.textContent = "Buscando...";
  lookupMessage.textContent = "Validando datos del cliente...";
  customerConfirmedInput.checked = false;

  try {
    const result = await lookupCustomerByPhone(completePhone);

    if (!result.ok || !result.customer) {
      customerData = null;
      customerCard.classList.add("is-hidden");
      lookupMessage.textContent =
        "No encontramos ese telefono en la base. Revisa el numero o cargalo en la hoja de clientes.";
      return;
    }

    customerData = result.customer;
    fillCustomerCard(customerData);
    customerCard.classList.remove("is-hidden");
    lookupMessage.textContent = "Cliente encontrado. Ya podes continuar.";
    lookupMessage.classList.add("is-success");
  } catch (_) {
    customerData = null;
    customerCard.classList.add("is-hidden");
    lookupMessage.textContent = "No pudimos consultar la base ahora. Proba nuevamente.";
  } finally {
    lookupButton.disabled = false;
    lookupButton.textContent = "Buscar mis datos";
  }
}

function fillCustomerCard(customer) {
  customerFirstNameInput.value = customer.firstName || "";
  customerLastNameInput.value = customer.lastName || "";
  customerEmailInput.value = customer.email || "";
  customerAddressInput.value = customer.address || "";
  customerCityInput.value = customer.city || "";
  customerProvinceInput.value = customer.province || "";
}

function renderSummary() {
  const data = getFormData();

  summary.innerHTML = `
    <dl>
      <div>
        <dt>Cliente</dt>
        <dd>${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</dd>
      </div>
      <div>
        <dt>Tel&eacute;fono</dt>
        <dd>${escapeHtml(data.phone)}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>${escapeHtml(data.email || "No informado")}</dd>
      </div>
      <div>
        <dt>Direcci&oacute;n</dt>
        <dd>${escapeHtml(data.address)}, ${escapeHtml(data.city)}, ${escapeHtml(data.province)}</dd>
      </div>
      <div>
        <dt>Producto</dt>
        <dd>${escapeHtml(data.plan)} x ${data.planQuantity}</dd>
      </div>
      <div>
        <dt>Total estimado</dt>
        <dd>${escapeHtml(data.planPrice)}</dd>
      </div>
    </dl>
  `;
}

function getFormData() {
  const selectedPlanInput = form.querySelector('input[name="plan"]:checked');
  const selectedPlanCard = selectedPlanInput?.closest(".plan-card");
  const selectedQuantityInput = selectedPlanCard?.querySelector("[data-qty-input]");
  const planQuantity = getQuantityValue(selectedQuantityInput);
  const planUnitPrice = Number(selectedPlanInput?.dataset.unitPrice || 0);
  const planTotal = planUnitPrice * planQuantity;

  return {
    firstName: customerData?.firstName || "",
    lastName: customerData?.lastName || "",
    email: customerData?.email || "",
    address: customerData?.address || "",
    city: customerData?.city || "",
    province: customerData?.province || "",
    phone: `${normalizeDigits(lookupAreaCodeInput.value)}${normalizeDigits(lookupPhoneInput.value)}`,
    plan: selectedPlanInput?.dataset.label || "",
    planQuantity,
    planPrice: formatCurrency(planTotal),
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

function lookupCustomerByPhone(phoneValue) {
  return jsonpRequest(customerScriptUrl, {
    action: "lookup",
    phone: phoneValue,
  });
}

function jsonpRequest(baseUrl, params) {
  return new Promise((resolve, reject) => {
    const callbackName = `__ivessLookup_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("jsonp_timeout"));
    }, 10000);

    function cleanup() {
      clearTimeout(timeout);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      try {
        delete window[callbackName];
      } catch (_) {
        window[callbackName] = undefined;
      }
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    const queryParams = new URLSearchParams({
      ...params,
      callback: callbackName,
    });

    script.src = `${baseUrl}?${queryParams.toString()}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("jsonp_error"));
    };
    document.head.appendChild(script);
  });
}

async function sendOrderToAppsScript(data) {
  if (!customerScriptUrl) {
    return { ok: false, error: "missing_script_url" };
  }

  const payload = {
    action: "order",
    ...data,
    source: "ivess-reggieri-reorder",
    submittedAt: new Date().toISOString(),
  };

  try {
    await fetch(customerScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    return { ok: true };
  } catch (_) {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        const beaconPayload = new Blob([JSON.stringify(payload)], {
          type: "text/plain;charset=UTF-8",
        });
        const accepted = navigator.sendBeacon(customerScriptUrl, beaconPayload);

        if (accepted) {
          return { ok: true };
        }
      } catch (_) {
        return { ok: false, error: "beacon_error" };
      }
    }

    return { ok: false, error: "network_error" };
  }
}

function normalizeValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeDigits(value) {
  return normalizeValue(value).replace(/\D/g, "");
}

function setFieldError(field, message) {
  if (!field) {
    return;
  }
  field.setCustomValidity(message);
  field.reportValidity();
}

function clearFieldError(field) {
  if (!field) {
    return;
  }
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
