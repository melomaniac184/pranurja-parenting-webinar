/**
 * Parenting Webinar Landing Page - Client Application
 * Connects registration form directly to the deployed Google Apps Script backend.
 * Handles validation, JSON POST submission, strict response verification (success: true + registrationId),
 * conditional WhatsApp reveal, and mobile sticky CTA.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const form = document.getElementById("leadForm");
  const parentNameInput = document.getElementById("parentName");
  const phoneInput = document.getElementById("whatsappNumber");
  const childAgeInput = document.getElementById("childAge");
  const cityInput = document.getElementById("city");
  const reasonInput = document.getElementById("reasonForJoining");
  const consentCheckbox = document.getElementById("consentCheckbox");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;

  // Status Boxes & Elements
  const errorBox = document.getElementById("formErrorBox");
  const errorMessage = document.getElementById("formErrorMessage");
  const retryBtn = document.getElementById("retrySubmitBtn");
  const successBox = document.getElementById("formSuccessBox");
  const successTitle = document.getElementById("successTitle");
  const successDesc = document.getElementById("successDesc");
  const whatsappActionWrap = document.getElementById("whatsappActionWrap");
  const whatsappGroupBtn = document.getElementById("whatsappGroupBtn");

  // Error Text Elements
  const nameError = document.getElementById("nameError");
  const phoneError = document.getElementById("phoneError");
  const ageError = document.getElementById("ageError");
  const cityError = document.getElementById("cityError");
  const consentError = document.getElementById("consentError");

  // Mobile Sticky CTA & Notice
  const stickyMobileCta = document.getElementById("stickyMobileCta");
  const regCard = document.getElementById("registration-form");
  const eventScheduleNotice = document.getElementById("eventScheduleNotice");

  // Apply configurable event notice if defined
  if (CONFIG && CONFIG.event && CONFIG.event.scheduleNoticeMarathi && eventScheduleNotice) {
    eventScheduleNotice.innerHTML = `<strong>तारीख आणि वेळ:</strong> ${CONFIG.event.scheduleNoticeMarathi}`;
  }

  // --- Real-time Validation Cleaners ---
  if (parentNameInput) {
    parentNameInput.addEventListener("input", () => {
      if (parentNameInput.value.trim().length >= 2) {
        clearFieldError(parentNameInput, nameError);
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, "");
      if (/^[6-9]\d{9}$/.test(phoneInput.value.trim())) {
        clearFieldError(phoneInput, phoneError);
      }
    });
  }

  if (childAgeInput) {
    childAgeInput.addEventListener("input", () => {
      const val = childAgeInput.value.trim();
      if (!val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 15)) {
        clearFieldError(childAgeInput, ageError);
      }
    });
  }

  if (cityInput) {
    cityInput.addEventListener("input", () => {
      if (cityInput.value.trim().length >= 2) {
        clearFieldError(cityInput, cityError);
      }
    });
  }

  if (consentCheckbox) {
    consentCheckbox.addEventListener("change", () => {
      if (consentCheckbox.checked && consentError) {
        consentError.classList.remove("active");
      }
    });
  }

  // --- Field Error Utilities ---
  function setFieldError(input, errorElement, message) {
    if (input) input.classList.add("is-invalid");
    if (errorElement) {
      if (message) errorElement.textContent = message;
      errorElement.classList.add("active");
    }
  }

  function clearFieldError(input, errorElement) {
    if (input) input.classList.remove("is-invalid");
    if (errorElement) {
      errorElement.classList.remove("active");
    }
  }

  function clearAllErrors() {
    clearFieldError(parentNameInput, nameError);
    clearFieldError(phoneInput, phoneError);
    clearFieldError(childAgeInput, ageError);
    clearFieldError(cityInput, cityError);
    if (consentError) consentError.classList.remove("active");
    hideErrorBox();
  }

  function showErrorBox(msg) {
    if (errorMessage) {
      errorMessage.textContent = msg || "माहिती जतन करताना तांत्रिक अडचण आली. कृपया आपले इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.";
    }
    if (errorBox) errorBox.classList.add("show");
  }

  function hideErrorBox() {
    if (errorBox) errorBox.classList.remove("show");
  }

  // --- Validation Logic ---
  function validateForm() {
    let isValid = true;
    clearAllErrors();

    // 1. Parent Full Name (Required, min 2 chars)
    const nameVal = parentNameInput.value.trim();
    if (!nameVal || nameVal.length < 2) {
      setFieldError(parentNameInput, nameError, "कृपया आपले पूर्ण नाव प्रविष्ट करा (किमान २ अक्षरे).");
      isValid = false;
    }

    // 2. WhatsApp Mobile Number (Required, 10-digit Indian mobile)
    const phoneVal = phoneInput.value.trim();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneVal)) {
      setFieldError(phoneInput, phoneError, "कृपया वैध १० अंकी व्हॉट्सॲप नंबर प्रविष्ट करा (उदा. 9822012345).");
      isValid = false;
    }

    // 3. Child's Age (Optional: Validated ONLY if entered; 1 to 15 years)
    const ageVal = childAgeInput.value.trim();
    if (ageVal) {
      const parsedAge = parseInt(ageVal, 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 15) {
        setFieldError(childAgeInput, ageError, "कृपया १ ते १५ दरम्यान वैध वय प्रविष्ट करा.");
        isValid = false;
      }
    }

    // 4. City (Required, min 2 chars)
    const cityVal = cityInput.value.trim();
    if (!cityVal || cityVal.length < 2) {
      setFieldError(cityInput, cityError, "कृपया आपले शहर प्रविष्ट करा.");
      isValid = false;
    }

    // 5. Reason for joining is optional

    // 6. Consent Checkbox (Required)
    if (!consentCheckbox.checked) {
      if (consentError) consentError.classList.add("active");
      isValid = false;
    }

    return isValid;
  }

  // --- Extract Campaign Name from URL or Default ---
  function getCampaignName() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("utm_campaign") || params.get("campaign") || "Parenting Webinar";
    } catch (e) {
      return "Parenting Webinar";
    }
  }

  // --- Real Google Sheets Submitter (POST with JSON Payload) ---
  async function submitToGoogleSheets(payload, endpoint) {
    /**
     * Cross-Origin POST to Google Apps Script Web App:
     * Using Content-Type 'text/plain;charset=utf-8' with a JSON string body sends
     * a CORS-safelisted 'simple request', avoiding the preflight OPTIONS request
     * which Google Apps Script does not support. The Apps Script backend reads the
     * JSON via JSON.parse(e.postData.contents).
     * Because mode is NOT 'no-cors', the browser receives and parses the JSON response.
     */
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  // --- Form Submission Handler ---
  async function handleFormSubmit(e) {
    if (e) e.preventDefault();

    if (!validateForm()) {
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Exact JSON properties required by Google Apps Script backend:
    const leadData = {
      parentName: parentNameInput.value.trim(),
      whatsappNumber: phoneInput.value.trim(),
      childAge: childAgeInput.value.trim() ? childAgeInput.value.trim() : "",
      city: cityInput.value.trim(),
      reason: reasonInput.value.trim() ? reasonInput.value.trim() : "",
      consent: consentCheckbox.checked,
      leadSource: "Website",
      campaignName: getCampaignName()
    };

    setLoadingState(true);
    hideErrorBox();

    try {
      const endpoint = (CONFIG && CONFIG.googleSheetEndpoint) ? CONFIG.googleSheetEndpoint.trim() : "";

      if (!endpoint || !endpoint.startsWith("http")) {
        renderFailureState("नोंदणी प्रणाली सध्या अनुपलब्ध आहे (Google Sheets endpoint configure केलेले नाही).");
        return;
      }

      // Live Google Apps Script endpoint is the ONLY submission method
      const result = await submitToGoogleSheets(leadData, endpoint);

      // Strict backend verification:
      // Must have success === true (or status === "success") AND a non-empty registrationId
      const isSuccess = Boolean(result && (result.success === true || result.status === "success"));
      const registrationId = (result && result.registrationId) ? String(result.registrationId).trim() : "";

      if (isSuccess && registrationId) {
        renderSuccessState(registrationId);
      } else {
        const errorMsg = (result && (result.message || result.error)) 
          ? (result.message || result.error)
          : "नोंदणी करताना तांत्रिक अडचण आली. कृपया पुन्हा प्रयत्न करा.";
        renderFailureState(errorMsg);
      }
    } catch (err) {
      console.error("Google Sheets Submission Error:", err);
      renderFailureState("नोंदणी करताना तांत्रिक अडचण आली (सर्व्हरशी संपर्क होऊ शकला नाही). कृपया आपले इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.");
    } finally {
      setLoadingState(false);
    }
  }

  // --- Loading State ---
  function setLoadingState(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.innerHTML = '<span class="spinner" aria-hidden="true"></span> माहिती जतन होत आहे...';
    } else {
      submitBtn.disabled = false;
      btnText.innerHTML = 'मोफत जागा आरक्षित करा ➔';
    }
  }

  // --- Failure State ---
  function renderFailureState(message) {
    showErrorBox(message);
    if (successBox) successBox.classList.remove("show");
    if (successTitle) successTitle.textContent = "";
    if (successDesc) successDesc.textContent = "";
    // Strictly prevent showing WhatsApp group before backend confirmation
    if (whatsappActionWrap) whatsappActionWrap.style.display = "none";
  }

  // --- Success State (Shown ONLY after backend confirms success: true AND valid registrationId) ---
  function renderSuccessState(registrationId) {
    if (!registrationId || typeof registrationId !== "string" || !registrationId.trim()) {
      renderFailureState("नोंदणी क्रमांक प्राप्त झाला नाही. कृपया पुन्हा प्रयत्न करा.");
      return;
    }

    const cleanRegId = registrationId.trim();

    hideErrorBox();
    form.style.display = "none";
    successBox.classList.add("show");

    // Set and display the WhatsApp VIP Group Invitation button
    const trimmedUrl = (CONFIG && CONFIG.whatsappGroupUrl) ? CONFIG.whatsappGroupUrl.trim() : "";
    const hasValidWhatsAppUrl = trimmedUrl.length > 10 &&
                                (trimmedUrl.startsWith("https://chat.whatsapp.com/") ||
                                 trimmedUrl.startsWith("http"));

    successTitle.textContent = "अभिनंदन! तुमची नोंदणी यशस्वी झाली आहे.";

    if (hasValidWhatsAppUrl) {
      successDesc.textContent = `नोंदणी क्रमांक: ${cleanRegId} | तुमची मोफत जागा आरक्षित झाली आहे. वेबिनारची थेट Zoom लिंक आणि महत्त्वाचे अपडेट्स मिळवण्यासाठी कृपया खालील WhatsApp ग्रुपमध्ये सामील व्हा.`;
      whatsappGroupBtn.href = trimmedUrl;
      whatsappActionWrap.style.display = "block";
    } else {
      successDesc.textContent = `नोंदणी क्रमांक: ${cleanRegId} | तुमची मोफत जागा निश्चित झाली आहे. वेबिनारचे सर्व तपशील आणि Zoom लिंक तुम्हाला लवकरच व्हॉट्सॲपवर पाठवले जातील.`;
      whatsappActionWrap.style.display = "none";
    }

    regCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // --- Event Listeners ---
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      hideErrorBox();
      handleFormSubmit();
    });
  }

  // Smooth scroll links & focus on registration form
  const scrollTriggers = document.querySelectorAll('a[href="#registration-form"]');
  scrollTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      regCard.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        if (form.style.display !== "none") {
          parentNameInput.focus();
        }
      }, 500);
    });
  });

  // --- Sticky Mobile CTA Visibility Observer ---
  if ("IntersectionObserver" in window && stickyMobileCta && regCard) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stickyMobileCta.style.transform = "translateY(100%)";
            stickyMobileCta.setAttribute("aria-hidden", "true");
          } else {
            stickyMobileCta.style.transform = "translateY(0)";
            stickyMobileCta.setAttribute("aria-hidden", "false");
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(regCard);
  }
});
