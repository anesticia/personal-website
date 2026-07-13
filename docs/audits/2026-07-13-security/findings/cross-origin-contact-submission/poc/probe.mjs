const target = new URL(process.argv[2] ?? "http://127.0.0.1:3000/api/contact");

if (target.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname)) {
  console.error("[-] Refusing a non-local target. Use http://127.0.0.1, localhost, or [::1].");
  process.exit(2);
}

const payload = {
  name: "Local Security Probe",
  email: "probe@example.test",
  purpose: "other",
  message: "Local-only cross-origin validation message; do not deliver.",
  website: ""
};

console.log(`[+] target: ${target}`);
console.log("[+] sent Origin: http://attacker.example");
console.log("[+] sent Content-Type: text/plain;charset=UTF-8");

const response = await fetch(target, {
  method: "POST",
  headers: {
    "Content-Type": "text/plain;charset=UTF-8",
    "Origin": "http://attacker.example"
  },
  body: JSON.stringify(payload)
});

let message = "";
try {
  const body = await response.json();
  message = typeof body?.message === "string" ? body.message : JSON.stringify(body);
} catch {
  message = await response.text();
}

console.log(`[+] status: ${response.status}`);
console.log(`[+] response: ${message || "<empty>"}`);

if (response.status === 503 && message.includes("Email delivery is not configured")) {
  console.log("[+] vulnerable branch reached: the request passed parsing and schema validation");
} else if (response.status === 403 || response.status === 415) {
  console.log("[+] fixed behavior: request rejected before contact processing");
} else {
  console.log("[?] Review the response against the target's local configuration.");
}
