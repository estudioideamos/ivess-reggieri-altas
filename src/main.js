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

let currentStep = 0;

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

  const data = getFormData();
  formMessage.textContent =
    "Solicitud enviada. El equipo de Ivess Reggieri puede contactarte por WhatsApp para confirmar cobertura y coordinar el alta.";
  formMessage.classList.add("is-success");
  console.table(data);
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

  summary.innerHTML = `
    <dl>
      <div>
        <dt>Servicio</dt>
        <dd>${data.serviceType}</dd>
      </div>
      <div>
        <dt>Direccion</dt>
        <dd>${data.address}, ${data.city}, ${data.province}</dd>
      </div>
      <div>
        <dt>Contacto</dt>
        <dd>${data.firstName} ${data.lastName}</dd>
      </div>
      <div>
        <dt>Canal</dt>
        <dd>${data.areaCode} ${data.phone} / ${data.email}</dd>
      </div>
      <div>
        <dt>Entrega</dt>
        <dd>${data.propertyType || "No informado"} - ${data.timeSlot || "No informado"}</dd>
      </div>
      <div>
        <dt>Producto</dt>
        <dd>${data.plan}${data.planPrice ? ` - ${data.planPrice}` : ""}</dd>
      </div>
    </dl>
  `;
}

function getFormData() {
  const data = new FormData(form);
  const selectedPlanInput = form.querySelector('input[name="plan"]:checked');

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
    plan: selectedPlanInput?.dataset.label || normalizeValue(data.get("plan")),
    planPrice: selectedPlanInput?.dataset.price || "",
  };
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
