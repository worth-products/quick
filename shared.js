/* ===== Session & Role ===== */
function login(role) {
  localStorage.setItem("sessionRole", role);
}
function logout() {
  localStorage.removeItem("sessionRole");
  window.location.href = "login.html";
}
function getRole() {
  return localStorage.getItem("sessionRole");
}
function requireRole(allowedRole) {
  const role = getRole();
  if (role !== allowedRole) {
    alert("Access denied. Please log in with the correct role.");
    window.location.href = "login.html";
  }
}

/* ===== Crypto (AES) =====
   IMPORTANT: Replace with a secure key management approach in production.
   For demo, a static key is used. */
const SECRET_KEY = "ChangeThis_To_A_Strong_Key_2025!";

function encryptXML(xmlText) {
  return CryptoJS.AES.encrypt(xmlText, SECRET_KEY).toString();
}
function decryptXML(cipherText) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Decryption failed:", e);
    return null;
  }
}

/* ===== Local DB ===== */
function getClaimsDB() {
  return JSON.parse(localStorage.getItem("claimsDB") || "{}");
}
function saveClaimsDB(db) {
  localStorage.setItem("claimsDB", JSON.stringify(db));
}

/* ===== XML Helpers ===== */
function escapeXml(s) {
  return String(s ?? "")
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

function generateClaimXML(data, opts = {}) {
  const reason = opts.rejectionReason ? `<RejectionReason>${escapeXml(opts.rejectionReason)}</RejectionReason>` : "";
  return `<MedicalClaim>
  <Patient>
    <Name>${escapeXml(data.patientName)}</Name>
    <DOB>${escapeXml(data.dob)}</DOB>
    <Gender>${escapeXml(data.gender)}</Gender>
  </Patient>
  <Insurance>
    <PolicyNumber>${escapeXml(data.policyNo)}</PolicyNumber>
    <Insurer>${escapeXml(data.insurer)}</Insurer>
    <PlanType>${escapeXml(data.planType)}</PlanType>
  </Insurance>
  <Claim>
    <ClaimID>${escapeXml(data.claimId)}</ClaimID>
    <DateOfService>${escapeXml(data.dos)}</DateOfService>
    <DiagnosisCode>${escapeXml(data.diag)}</DiagnosisCode>
    <ClaimAmount>${escapeXml(data.amount)}</ClaimAmount>
  </Claim>
  <Provider>
    <Hospital>${escapeXml(data.hospital)}</Hospital>
    <NPI>${escapeXml(data.npi)}</NPI>
  </Provider>
  <Status>${escapeXml(data.status || "Submitted")}</Status>
  ${reason}
</MedicalClaim>`;
}

/* ===== Validation =====
   Adjust rules as per policy. */
function validateClaim(data, opts = {}) {
  const errors = [];
  const required = [
    ["patientName","Patient Name"],
    ["dob","DOB"],
    ["gender","Gender"],
    ["policyNo","Policy Number"],
    ["insurer","Insurer"],
    ["planType","Plan Type"],
    ["claimId","Claim ID"],
    ["dos","Date of Service"],
    ["diag","Diagnosis Code"],
    ["amount","Claim Amount"],
    ["hospital","Hospital/Provider"],
    ["npi","NPI"]
  ];

  if (opts.requireAll) {
    required.forEach(([k,label]) => {
      if (!String(data[k]||"").trim()) errors.push(`${label} is required`);
    });
  }

  // YYYY-MM-DD checks (simple)
  const dateLike = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (data.dob && !dateLike(data.dob)) errors.push("DOB must be YYYY-MM-DD");
  if (data.dos && !dateLike(data.dos)) errors.push("Date of Service must be YYYY-MM-DD");

  // Amount numeric
  if (opts.numericAmount) {
    const amt = Number(data.amount);
    if (!(isFinite(amt) && amt >= 0)) errors.push("Claim Amount must be a non-negative number");
  }

  // Basic ICD-like (very loose demo check)
  if (data.diag && !/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/.test(data.diag)) {
    // Keep it a warning or error as you prefer
    errors.push("Diagnosis Code format looks invalid (demo check)");
  }

  return errors;
}
