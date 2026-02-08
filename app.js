import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getIdTokenResult
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authDialog = document.getElementById("authDialog");
const openAuthBtn = document.getElementById("openAuthBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authMessage = document.getElementById("authMessage");
const paymentForm = document.getElementById("paymentForm");
const selectedPlanInput = document.getElementById("selectedPlanInput");
const paymentStatus = document.getElementById("paymentStatus");
const accessMessage = document.getElementById("accessMessage");
const paidContent = document.getElementById("paidContent");
const adminPanel = document.getElementById("adminPanel");
const txList = document.getElementById("txList");

let selectedPlan = "free";
let currentUser = null;


function logAuthError(context, error) {
  const code = error && typeof error === "object" && "code" in error ? error.code : "unknown";
  console.error(`[auth:${context}]`, code, error);
}

function getSetupHint(error) {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  const setupCodes = new Set([
    "auth/unauthorized-domain",
    "auth/operation-not-allowed",
    "auth/network-request-failed",
    "auth/invalid-api-key",
    "auth/app-not-authorized",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key."
  ]);

  if (setupCodes.has(code)) {
    return " Setup issue detected. Check README Firebase checklist and browser console [auth:*] code.";
  }

  return "";
}

document.querySelectorAll("[data-plan]").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedPlan = btn.dataset.plan;
    selectedPlanInput.value = selectedPlan.toUpperCase();
    if (!currentUser) authDialog.showModal();
    document.getElementById("paymentSection").scrollIntoView({ behavior: "smooth" });
  });
});

openAuthBtn.addEventListener("click", () => authDialog.showModal());
logoutBtn.addEventListener("click", async () => signOut(auth));

document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    try {
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        role: "user",
        createdAt: serverTimestamp(),
        displayName: "Learner"
      }, { merge: true });
      authMessage.textContent = "Account created successfully.";
    } catch (profileError) {
      logAuthError("profile-write", profileError);
      authMessage.textContent = "Account created. You can login now.";
    }
  } catch (error) {
    logAuthError("signup", error);
    authMessage.textContent = `Unable to complete authentication. Please try again.${getSetupHint(error)}`;
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    await signInWithEmailAndPassword(auth, email, password);
    authMessage.textContent = "Login successful.";
    authDialog.close();
  } catch (error) {
    logAuthError("login", error);
    authMessage.textContent = `Unable to complete authentication. Please try again.${getSetupHint(error)}`;
  }
});

paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) {
    paymentStatus.textContent = "Please login first.";
    authDialog.showModal();
    return;
  }
  if (selectedPlan === "free") {
    paymentStatus.textContent = "Free plan is active. No payment needed.";
    return;
  }

  const transactionId = document.getElementById("transactionInput").value.trim();
  await setDoc(doc(db, "purchases", currentUser.uid), {
    uid: currentUser.uid,
    plan: selectedPlan,
    transactionId,
    status: "Pending",
    updatedAt: serverTimestamp()
  }, { merge: true });
  paymentStatus.textContent = "Payment under verification";
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  openAuthBtn.classList.toggle("hidden", Boolean(user));
  logoutBtn.classList.toggle("hidden", !user);
  if (!user) {
    accessMessage.textContent = "Guest access: Free plan content only.";
    paidContent.classList.add("hidden");
    adminPanel.classList.add("hidden");
    return;
  }

  const token = await getIdTokenResult(user, true);
  const isAdmin = Boolean(token.claims.admin);
  const purchaseSnap = await getDoc(doc(db, "purchases", user.uid));
  const purchase = purchaseSnap.exists() ? purchaseSnap.data() : null;

  if (purchase?.status === "Approved") {
    accessMessage.textContent = `Approved ${purchase.plan.toUpperCase()} plan: full course unlocked.`;
    paidContent.classList.remove("hidden");
  } else {
    accessMessage.textContent = "Logged in. Paid content unlocks after verified approval.";
    paidContent.classList.add("hidden");
  }

  if (isAdmin) {
    adminPanel.classList.remove("hidden");
    await loadTransactions();
  } else {
    adminPanel.classList.add("hidden");
  }
});

async function loadTransactions() {
  txList.innerHTML = "";
  const pending = await getDocs(query(collection(db, "purchases"), where("status", "==", "Pending")));
  pending.forEach((entry) => {
    const data = entry.data();
    const item = document.createElement("article");
    item.innerHTML = `
      <p><strong>UID:</strong> ${data.uid}</p>
      <p><strong>Plan:</strong> ${data.plan}</p>
      <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
      <button class="btn" data-action="approve" data-id="${entry.id}">Approve</button>
      <button class="btn ghost" data-action="reject" data-id="${entry.id}">Reject</button>
    `;
    txList.appendChild(item);
  });

  txList.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const nextStatus = button.dataset.action === "approve" ? "Approved" : "Rejected";
      await updateDoc(doc(db, "purchases", button.dataset.id), {
        status: nextStatus,
        verifiedAt: serverTimestamp()
      });
      await loadTransactions();
    });
  });
}

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  revealElements.forEach((el) => el.classList.add("animate-init"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });
  revealElements.forEach((el) => observer.observe(el));
}

selectedPlanInput.value = "FREE";
