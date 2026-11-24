/**
 * ============================================================================
 * MedCare Hospital Appointment Booking System
 * Pure ES6 JavaScript + LocalStorage Database (Zero External Dependencies)
 * ============================================================================
 */

(() => {
  "use strict";

  /* ==========================================================================
     1. STORAGE DATABASE LAYER (LocalStorage)
     ========================================================================== */
  const KEYS = {
    USERS: "hms_users",
    DOCTORS: "hms_doctors",
    PATIENTS: "hms_patients",
    APPOINTMENTS: "hms_appointments",
    REVIEWS: "hms_reviews",
    PAYMENTS: "hms_payments",
    REFUNDS: "hms_refunds",
    TICKETS: "hms_tickets",
    CHATS: "hms_chats",
    NOTIFICATIONS: "hms_notifications",
    EMAILS: "hms_emails",
    SESSION: "hms_session",
    THEME: "hms_theme"
  };

  const DB = {
    get(key, fallback = []) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) {
        console.error(`Error reading ${key}:`, err);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error(`Error writing ${key}:`, err);
      }
    },
    clearAll() {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    }
  };

  /* ==========================================================================
     2. UTILITIES & HELPERS
     ========================================================================== */
  const Utils = {
    uid(prefix = "ID") {
      return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    },
    txnId() {
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      return `TXN-${stamp}-${Math.floor(100000 + Math.random() * 900000)}`;
    },
    escapeHtml(str) {
      return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
    formatCurrency(amount) {
      return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
    },
    todayISO() {
      return new Date().toISOString().split("T")[0];
    },
    nowFormatted() {
      return new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    initials(name) {
      return (name || "U")
        .replace(/^Dr\.\s*/i, "")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    },
    statusClass(status) {
      return `status-${String(status || "").toLowerCase().replace(/\s+/g, "-")}`;
    },
    renderStars(rating) {
      const r = Math.round(Number(rating) || 0);
      return `<span class="stars" aria-label="${r} out of 5 stars">${"&#9733;".repeat(r)}${"&#9734;".repeat(5 - r)}</span>`;
    },
    getDoctorRatingStats(doctorId) {
      const reviews = DB.get(KEYS.REVIEWS).filter((r) => r.doctorId === doctorId);
      if (!reviews.length) return { avg: 0, count: 0 };
      const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
      return { avg: Number((sum / reviews.length).toFixed(1)), count: reviews.length };
    },
    getRankedDoctors() {
      const doctors = DB.get(KEYS.DOCTORS);
      return doctors
        .map((doc) => {
          const stats = Utils.getDoctorRatingStats(doc.id);
          return { ...doc, avgRating: stats.avg, reviewCount: stats.count };
        })
        .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
        .map((doc, idx) => ({ ...doc, rank: idx + 1 }));
    },
    validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    validatePhone(phone) {
      return /^[0-9]{10}$/.test(String(phone).replace(/[\s-]/g, ""));
    }
  };

  /* ==========================================================================
     3. SAMPLE DATA SEEDING (5 Doctors, 10 Patients, Reviews, Payments, etc.)
     ========================================================================== */
  const DEFAULT_SLOTS = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
    "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function seedDatabase(force = false) {
    if (!force && localStorage.getItem(KEYS.USERS)) return;

    const doctors = [
      {
        id: "DOC-1",
        name: "Dr. Ananya Rao",
        email: "ananya.rao@medcare.in",
        phone: "9845011223",
        specialization: "Cardiology",
        qualification: "MBBS, MD, DM (Cardiology)",
        experience: 14,
        fee: 900,
        bio: "Senior Interventional Cardiologist specialising in preventive heart care, ECG diagnostics, and hypertension management.",
        availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        availableSlots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"]
      },
      {
        id: "DOC-2",
        name: "Dr. Vikram Mehta",
        email: "vikram.mehta@medcare.in",
        phone: "9845011224",
        specialization: "Orthopedics",
        qualification: "MBBS, MS (Orthopedics)",
        experience: 11,
        fee: 750,
        bio: "Joint replacement and sports injury specialist focused on minimally invasive arthroscopy and spine rehabilitation.",
        availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        availableSlots: ["09:30 AM", "10:30 AM", "11:30 AM", "02:30 PM", "04:00 PM", "05:00 PM"]
      },
      {
        id: "DOC-3",
        name: "Dr. Priya Nair",
        email: "priya.nair@medcare.in",
        phone: "9845011225",
        specialization: "Dermatology",
        qualification: "MBBS, MD (Dermatology)",
        experience: 9,
        fee: 650,
        bio: "Clinical and cosmetic dermatologist treating acne, eczema, hair loss, and skin allergies with evidence-based protocols.",
        availableDays: ["Mon", "Tue", "Thu", "Fri", "Sat"],
        availableSlots: ["10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "03:00 PM", "05:00 PM"]
      },
      {
        id: "DOC-4",
        name: "Dr. Rohan Kulkarni",
        email: "rohan.kulkarni@medcare.in",
        phone: "9845011226",
        specialization: "Pediatrics",
        qualification: "MBBS, MD (Pediatrics)",
        experience: 8,
        fee: 600,
        bio: "Child health specialist providing newborn care, immunisations, growth tracking, and paediatric allergy management.",
        availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        availableSlots: ["09:00 AM", "09:30 AM", "10:30 AM", "11:30 AM", "03:00 PM", "04:00 PM"]
      },
      {
        id: "DOC-5",
        name: "Dr. Sneha Iyer",
        email: "sneha.iyer@medcare.in",
        phone: "9845011227",
        specialization: "Neurology",
        qualification: "MBBS, MD, DM (Neurology)",
        experience: 12,
        fee: 950,
        bio: "Consultant Neurologist experienced in migraine management, epilepsy care, nerve disorders, and stroke recovery.",
        availableDays: ["Mon", "Wed", "Thu", "Fri", "Sat"],
        availableSlots: ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "03:00 PM"]
      }
    ];

    const patients = [
      { id: "PAT-1", name: "Aarav Sharma", email: "aarav.sharma@example.com", phone: "9876500001", age: 31, gender: "Male", bloodGroup: "O+", address: "Indiranagar, Bengaluru" },
      { id: "PAT-2", name: "Diya Verma", email: "diya.verma@example.com", phone: "9876500002", age: 27, gender: "Female", bloodGroup: "A+", address: "Koramangala, Bengaluru" },
      { id: "PAT-3", name: "Kabir Patel", email: "kabir.patel@example.com", phone: "9876500003", age: 42, gender: "Male", bloodGroup: "B+", address: "Whitefield, Bengaluru" },
      { id: "PAT-4", name: "Meera Joshi", email: "meera.joshi@example.com", phone: "9876500004", age: 35, gender: "Female", bloodGroup: "AB+", address: "Jayanagar, Bengaluru" },
      { id: "PAT-5", name: "Arjun Reddy", email: "arjun.reddy@example.com", phone: "9876500005", age: 29, gender: "Male", bloodGroup: "O-", address: "HSR Layout, Bengaluru" },
      { id: "PAT-6", name: "Ishita Sen", email: "ishita.sen@example.com", phone: "9876500006", age: 24, gender: "Female", bloodGroup: "A-", address: "BTM Layout, Bengaluru" },
      { id: "PAT-7", name: "Devansh Gupta", email: "devansh.gupta@example.com", phone: "9876500007", age: 50, gender: "Male", bloodGroup: "B-", address: "Malleshwaram, Bengaluru" },
      { id: "PAT-8", name: "Tanvi Deshmukh", email: "tanvi.deshmukh@example.com", phone: "9876500008", age: 33, gender: "Female", bloodGroup: "O+", address: "JP Nagar, Bengaluru" },
      { id: "PAT-9", name: "Siddharth Menon", email: "siddharth.menon@example.com", phone: "9876500009", age: 38, gender: "Male", bloodGroup: "A+", address: "Hebbal, Bengaluru" },
      { id: "PAT-10", name: "Riya Kapoor", email: "riya.kapoor@example.com", phone: "9876500010", age: 26, gender: "Female", bloodGroup: "B+", address: "Marathahalli, Bengaluru" }
    ];

    const users = [
      { id: "ADM-1", role: "admin", name: "Hospital Admin", email: "admin@medcare.in", password: "password123", profileId: "ADM-1" },
      ...doctors.map((d) => ({ id: d.id, role: "doctor", name: d.name, email: d.email, password: "password123", profileId: d.id })),
      ...patients.map((p) => ({ id: p.id, role: "patient", name: p.name, email: p.email, password: "password123", profileId: p.id }))
    ];

    const today = Utils.todayISO();
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];

    const appointments = [
      {
        id: "APT-101", patientId: "PAT-1", doctorId: "DOC-1", date: yesterday, timeSlot: "10:00 AM",
        reason: "Routine cardiac check-up and BP review", status: "Completed", paymentStatus: "Paid", fee: 900, createdAt: twoDaysAgo
      },
      {
        id: "APT-102", patientId: "PAT-1", doctorId: "DOC-3", date: tomorrow, timeSlot: "11:00 AM",
        reason: "Seasonal skin rash consultation", status: "Approved", paymentStatus: "Paid", fee: 650, createdAt: today
      },
      {
        id: "APT-103", patientId: "PAT-1", doctorId: "DOC-2", date: tomorrow, timeSlot: "02:30 PM",
        reason: "Knee pain after running", status: "Pending", paymentStatus: "Unpaid", fee: 750, createdAt: today
      },
      {
        id: "APT-104", patientId: "PAT-2", doctorId: "DOC-5", date: twoDaysAgo, timeSlot: "10:00 AM",
        reason: "Recurring migraine headaches", status: "Completed", paymentStatus: "Paid", fee: 950, createdAt: twoDaysAgo
      },
      {
        id: "APT-105", patientId: "PAT-3", doctorId: "DOC-1", date: today, timeSlot: "02:00 PM",
        reason: "Follow-up cholesterol report review", status: "Pending", paymentStatus: "Unpaid", fee: 900, createdAt: today
      },
      {
        id: "APT-106", patientId: "PAT-4", doctorId: "DOC-4", date: yesterday, timeSlot: "09:30 AM",
        reason: "Paediatric vaccination schedule", status: "Completed", paymentStatus: "Paid", fee: 600, createdAt: twoDaysAgo
      },
      {
        id: "APT-107", patientId: "PAT-5", doctorId: "DOC-2", date: today, timeSlot: "04:00 PM",
        reason: "Lower back stiffness", status: "Cancelled", paymentStatus: "Paid", fee: 750, createdAt: yesterday
      },
      {
        id: "APT-108", patientId: "PAT-6", doctorId: "DOC-3", date: yesterday, timeSlot: "03:00 PM",
        reason: "Acne treatment follow-up", status: "Rejected", paymentStatus: "Unpaid", fee: 650, createdAt: twoDaysAgo
      }
    ];

    const payments = [
      { id: "PAY-201", transactionId: "TXN-20261122-482910", appointmentId: "APT-101", patientId: "PAT-1", doctorId: "DOC-1", amount: 900, method: "UPI", status: "Paid", date: twoDaysAgo },
      { id: "PAY-202", transactionId: "TXN-20261124-915320", appointmentId: "APT-102", patientId: "PAT-1", doctorId: "DOC-3", amount: 650, method: "Credit Card", status: "Paid", date: today },
      { id: "PAY-203", transactionId: "TXN-20261122-774102", appointmentId: "APT-104", patientId: "PAT-2", doctorId: "DOC-5", amount: 950, method: "Net Banking", status: "Paid", date: twoDaysAgo },
      { id: "PAY-204", transactionId: "TXN-20261123-661209", appointmentId: "APT-106", patientId: "PAT-4", doctorId: "DOC-4", amount: 600, method: "Debit Card", status: "Paid", date: yesterday },
      { id: "PAY-205", transactionId: "TXN-20261123-339014", appointmentId: "APT-107", patientId: "PAT-5", doctorId: "DOC-2", amount: 750, method: "UPI", status: "Paid", date: yesterday }
    ];

    const refunds = [
      {
        id: "REF-301", paymentId: "PAY-205", appointmentId: "APT-107", patientId: "PAT-5",
        amount: 750, reason: "Had to cancel appointment due to travel emergency.", status: "Pending",
        requestedAt: today, adminNote: ""
      }
    ];

    const reviews = [
      { id: "REV-401", doctorId: "DOC-1", patientId: "PAT-1", appointmentId: "APT-101", rating: 5, comment: "Dr. Ananya explained my ECG clearly and gave practical lifestyle advice.", date: yesterday },
      { id: "REV-402", doctorId: "DOC-1", patientId: "PAT-3", appointmentId: "", rating: 5, comment: "Very thorough and calm. Minimal waiting time.", date: twoDaysAgo },
      { id: "REV-403", doctorId: "DOC-5", patientId: "PAT-2", appointmentId: "APT-104", rating: 5, comment: "Finally got relief from chronic migraines. Highly recommended.", date: yesterday },
      { id: "REV-404", doctorId: "DOC-4", patientId: "PAT-4", appointmentId: "APT-106", rating: 4, comment: "Friendly with kids and very patient in answering all queries.", date: yesterday },
      { id: "REV-405", doctorId: "DOC-3", patientId: "PAT-6", appointmentId: "", rating: 4, comment: "Effective prescription and clear skincare routine.", date: twoDaysAgo },
      { id: "REV-406", doctorId: "DOC-2", patientId: "PAT-7", appointmentId: "", rating: 4, comment: "Good physiotherapy plan for shoulder pain.", date: twoDaysAgo }
    ];

    const tickets = [
      {
        id: "TKT-501", userId: "PAT-1", userRole: "patient", category: "Appointment Issue",
        priority: "Medium", subject: "Need invoice PDF copy for insurance claim",
        description: "Could you please share the itemized consultation receipt for APT-101?",
        status: "In Progress", adminReply: "Our billing desk has verified TXN-20261122-482910 and is preparing the itemized statement.",
        createdAt: yesterday, updatedAt: today
      },
      {
        id: "TKT-502", userId: "PAT-5", userRole: "patient", category: "Refund Issue",
        priority: "High", subject: "Refund status for cancelled orthopedic slot",
        description: "I cancelled APT-107 yesterday. Requesting quick processing of my ₹750 UPI refund.",
        status: "Open", adminReply: "",
        createdAt: today, updatedAt: today
      }
    ];

    const notifications = [
      { id: "NOT-601", userId: "PAT-1", message: "Your appointment APT-102 with Dr. Priya Nair is Approved.", read: false, createdAt: Utils.nowFormatted() },
      { id: "NOT-602", userId: "DOC-1", message: "New appointment request APT-105 from Kabir Patel.", read: false, createdAt: Utils.nowFormatted() },
      { id: "NOT-603", userId: "ADM-1", message: "Pending refund request REF-301 (₹750) requires review.", read: false, createdAt: Utils.nowFormatted() }
    ];

    const emails = [
      {
        id: "EML-701", to: "aarav.sharma@example.com", subject: "Appointment Approved — APT-102",
        body: "Hello Aarav Sharma, your appointment with Dr. Priya Nair on " + tomorrow + " at 11:00 AM has been approved.",
        sentAt: Utils.nowFormatted()
      },
      {
        id: "EML-702", to: "aarav.sharma@example.com", subject: "Payment Confirmation — TXN-20261124-915320",
        body: "We received ₹650 via Credit Card for appointment APT-102. Thank you for choosing MedCare Hospital.",
        sentAt: Utils.nowFormatted()
      }
    ];

    const chats = [
      {
        id: "CHT-801", userId: "PAT-1", sender: "bot",
        text: "Hello! Welcome to MedCare 24/7 Support. Ask me about booking appointments, payments, refunds, or doctor availability.",
        time: Utils.nowFormatted()
      }
    ];

    DB.set(KEYS.USERS, users);
    DB.set(KEYS.DOCTORS, doctors);
    DB.set(KEYS.PATIENTS, patients);
    DB.set(KEYS.APPOINTMENTS, appointments);
    DB.set(KEYS.PAYMENTS, payments);
    DB.set(KEYS.REFUNDS, refunds);
    DB.set(KEYS.REVIEWS, reviews);
    DB.set(KEYS.TICKETS, tickets);
    DB.set(KEYS.NOTIFICATIONS, notifications);
    DB.set(KEYS.EMAILS, emails);
    DB.set(KEYS.CHATS, chats);
  }

  /* ==========================================================================
     4. TOASTS, NOTIFICATIONS & SIMULATED EMAIL ENGINE
     ========================================================================== */
  const Toast = {
    show(message, type = "info") {
      const container = document.getElementById("toast-container");
      const el = document.createElement("div");
      el.className = `toast ${type}`;
      el.textContent = message;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateX(20px)";
        el.style.transition = "all 0.25s ease";
        setTimeout(() => el.remove(), 260);
      }, 3400);
    }
  };

  const Notifier = {
    notify(userId, message) {
      const list = DB.get(KEYS.NOTIFICATIONS);
      list.unshift({
        id: Utils.uid("NOT"),
        userId,
        message,
        read: false,
        createdAt: Utils.nowFormatted()
      });
      DB.set(KEYS.NOTIFICATIONS, list);
      App.refreshTopbarBadges();
    },
    sendEmail(toEmail, subject, body) {
      if (!toEmail) return;
      const emails = DB.get(KEYS.EMAILS);
      emails.unshift({
        id: Utils.uid("EML"),
        to: toEmail,
        subject,
        body,
        sentAt: Utils.nowFormatted()
      });
      DB.set(KEYS.EMAILS, emails);
      App.refreshTopbarBadges();
    }
  };

  /* ==========================================================================
     5. MODAL MANAGER
     ========================================================================== */
  const Modal = {
    open(title, htmlContent) {
      document.getElementById("modal-title").textContent = title;
      document.getElementById("modal-body").innerHTML = htmlContent;
      document.getElementById("modal-overlay").classList.remove("hidden");
    },
    close() {
      document.getElementById("modal-overlay").classList.add("hidden");
      document.getElementById("modal-body").innerHTML = "";
    }
  };

  /* ==========================================================================
     6. FAQ DATA & LIVE CHAT BOT LOGIC
     ========================================================================== */
  const FAQ_LIST = [
    { q: "How do I book an appointment with a doctor?", a: "Go to 'Find Doctors', filter by specialization or search by name, click 'Book Slot', pick a date and an available time slot, and confirm." },
    { q: "Can two patients book the same doctor at the exact same slot?", a: "No. MedCare automatically locks booked time slots and prevents duplicate bookings for the same doctor, date, and time." },
    { q: "Which payment methods are supported?", a: "You can pay via UPI, Debit Card, Credit Card, or Net Banking. Every successful payment generates a unique Transaction ID." },
    { q: "How do refunds work if I cancel an appointment?", a: "If you cancel a paid appointment, navigate to 'Payments & Refunds', submit a refund request with your reason, and our Admin team will review and process it." },
    { q: "When can I submit a doctor rating and review?", a: "Once a doctor marks your appointment as 'Completed', you can rate them from 1 to 5 stars and write a review." },
    { q: "Where can I see email confirmations?", a: "Click the envelope icon in the top-right bar to open the Simulated Email Log showing all automated booking, payment, refund, and ticket emails." }
  ];

  function generateBotReply(message) {
    const m = message.toLowerCase();
    if (m.includes("refund") || m.includes("money back")) {
      return "For refunds on paid appointments, open the 'Payments & Refunds' tab and click 'Request Refund'. Admins typically approve valid requests within minutes here.";
    }
    if (m.includes("pay") || m.includes("upi") || m.includes("card")) {
      return "We support UPI, Debit/Credit Cards, and Net Banking. You can pay directly from your 'My Appointments' table and download your transaction receipt.";
    }
    if (m.includes("book") || m.includes("appointment") || m.includes("slot")) {
      return "Visit 'Find Doctors' to browse specialists by rating and specialization, then choose any open time slot to book instantly.";
    }
    if (m.includes("cancel")) {
      return "You can cancel any Pending or Approved appointment from 'My Appointments'. If you already paid, you can immediately raise a refund request.";
    }
    if (m.includes("emergency") || m.includes("urgent") || m.includes("ambulance")) {
      return "For medical emergencies in India, please call 112 or 108 immediately, or visit the nearest hospital emergency wing.";
    }
    if (m.includes("doctor") || m.includes("rating") || m.includes("review")) {
      return "All doctors are ranked by verified patient ratings. You can submit a 1–5 star review after your appointment is marked Completed.";
    }
    return "Thanks for reaching out! A support coordinator has noted your message. You can also raise a formal Support Ticket above for tracked resolution.";
  }

  /* ==========================================================================
     7. APPLICATION STATE & NAVIGATION
     ========================================================================== */
  const App = {
    session: null,
    currentPage: "dashboard",

    init() {
      seedDatabase(false);
      this.initTheme();
      this.bindGlobalEvents();

      const saved = DB.get(KEYS.SESSION, null);
      if (saved && saved.userId) {
        const user = DB.get(KEYS.USERS).find((u) => u.id === saved.userId);
        if (user) {
          this.session = user;
          this.showAppShell();
          return;
        }
      }
      this.showAuthView();
    },

    initTheme() {
      const savedTheme = DB.get(KEYS.THEME, "light");
      document.documentElement.setAttribute("data-theme", savedTheme);
      this.updateThemeIcons(savedTheme);
    },

    toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      DB.set(KEYS.THEME, next);
      this.updateThemeIcons(next);
    },

    updateThemeIcons(theme) {
      const icon = theme === "dark" ? "&#9728;" : "&#9790;";
      const btn1 = document.getElementById("theme-toggle-btn");
      const btn2 = document.getElementById("auth-theme-toggle");
      if (btn1) btn1.innerHTML = icon;
      if (btn2) btn2.innerHTML = icon;
    },

    bindGlobalEvents() {
      // Theme toggles
      document.getElementById("theme-toggle-btn").addEventListener("click", () => this.toggleTheme());
      document.getElementById("auth-theme-toggle").addEventListener("click", () => this.toggleTheme());

      // Auth tabs
      document.querySelectorAll(".auth-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          const mode = tab.dataset.authTab;
          document.getElementById("login-form").classList.toggle("hidden", mode !== "login");
          document.getElementById("register-form").classList.toggle("hidden", mode !== "register");
        });
      });

      // Registration role switch
      document.getElementById("reg-role").addEventListener("change", (e) => {
        const isDoc = e.target.value === "doctor";
        document.getElementById("reg-doctor-fields").classList.toggle("hidden", !isDoc);
        document.getElementById("reg-patient-fields").classList.toggle("hidden", isDoc);
      });

      // Demo quick login buttons
      document.querySelectorAll("[data-demo-role]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const role = btn.dataset.demoRole;
          const map = {
            patient: { email: "aarav.sharma@example.com", password: "password123" },
            doctor: { email: "ananya.rao@medcare.in", password: "password123" },
            admin: { email: "admin@medcare.in", password: "password123" }
          };
          document.getElementById("login-role").value = role;
          document.getElementById("login-email").value = map[role].email;
          document.getElementById("login-password").value = map[role].password;
          this.handleLogin();
        });
      });

      // Reset sample data
      document.getElementById("reset-demo-btn").addEventListener("click", () => {
        if (confirm("Reset all LocalStorage data back to the initial sample dataset?")) {
          DB.clearAll();
          seedDatabase(true);
          Toast.show("Sample data restored successfully.", "success");
        }
      });

      // Login & Register submits
      document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });

      document.getElementById("register-form").addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleRegister();
      });

      // Logout
      document.getElementById("logout-btn").addEventListener("click", () => this.logout());

      // Mobile sidebar
      document.getElementById("mobile-menu-btn").addEventListener("click", () => this.toggleMobileSidebar(true));
      document.getElementById("sidebar-close-btn").addEventListener("click", () => this.toggleMobileSidebar(false));
      document.getElementById("sidebar-backdrop").addEventListener("click", () => this.toggleMobileSidebar(false));

      // Modal close
      document.getElementById("modal-close").addEventListener("click", () => Modal.close());
      document.getElementById("modal-overlay").addEventListener("click", (e) => {
        if (e.target.id === "modal-overlay") Modal.close();
      });

      // Notifications dropdown
      document.getElementById("notif-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const dd = document.getElementById("notif-dropdown");
        dd.classList.toggle("hidden");
        if (!dd.classList.contains("hidden")) this.renderNotificationsDropdown();
      });

      document.getElementById("mark-all-read-btn").addEventListener("click", () => {
        const list = DB.get(KEYS.NOTIFICATIONS).map((n) =>
          n.userId === this.session.id ? { ...n, read: true } : n
        );
        DB.set(KEYS.NOTIFICATIONS, list);
        this.renderNotificationsDropdown();
        this.refreshTopbarBadges();
      });

      document.addEventListener("click", (e) => {
        const dd = document.getElementById("notif-dropdown");
        if (dd && !dd.contains(e.target) && e.target.id !== "notif-btn") {
          dd.classList.add("hidden");
        }
      });

      // Simulated Email Log Modal
      document.getElementById("email-log-btn").addEventListener("click", () => this.openEmailLogModal());
    },

    toggleMobileSidebar(open) {
      document.getElementById("sidebar").classList.toggle("open", open);
      document.getElementById("sidebar-backdrop").classList.toggle("hidden", !open);
    },

    handleLogin() {
      const role = document.getElementById("login-role").value;
      const email = document.getElementById("login-email").value.trim().toLowerCase();
      const password = document.getElementById("login-password").value;
      const errBox = document.getElementById("login-error");
      errBox.classList.add("hidden");

      if (!Utils.validateEmail(email) || !password) {
        errBox.textContent = "Please enter a valid email address and password.";
        errBox.classList.remove("hidden");
        return;
      }

      const user = DB.get(KEYS.USERS).find(
        (u) => u.email.toLowerCase() === email && u.password === password && u.role === role
      );

      if (!user) {
        errBox.textContent = "Invalid credentials or wrong role selected.";
        errBox.classList.remove("hidden");
        return;
      }

      this.session = user;
      DB.set(KEYS.SESSION, { userId: user.id, role: user.role });
      Toast.show(`Welcome back, ${user.name}!`, "success");
      this.showAppShell();
    },

    handleRegister() {
      const role = document.getElementById("reg-role").value;
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim().toLowerCase();
      const phone = document.getElementById("reg-phone").value.trim();
      const password = document.getElementById("reg-password").value;
      const confirmPwd = document.getElementById("reg-confirm-password").value;
      const errBox = document.getElementById("reg-error");
      errBox.classList.add("hidden");

      if (!name || !Utils.validateEmail(email) || !Utils.validatePhone(phone)) {
        errBox.textContent = "Enter a valid full name, email address, and 10-digit phone number.";
        errBox.classList.remove("hidden");
        return;
      }
      if (password.length < 6 || password !== confirmPwd) {
        errBox.textContent = "Password must be at least 6 characters and match confirmation.";
        errBox.classList.remove("hidden");
        return;
      }

      const users = DB.get(KEYS.USERS);
      if (users.some((u) => u.email.toLowerCase() === email)) {
        errBox.textContent = "An account with this email already exists.";
        errBox.classList.remove("hidden");
        return;
      }

      const id = Utils.uid(role === "doctor" ? "DOC" : "PAT");
      const displayName = role === "doctor" && !/^dr\./i.test(name) ? `Dr. ${name}` : name;

      if (role === "doctor") {
        const doctors = DB.get(KEYS.DOCTORS);
        doctors.push({
          id,
          name: displayName,
          email,
          phone,
          specialization: document.getElementById("reg-specialization").value,
          qualification: document.getElementById("reg-qualification").value.trim() || "MBBS",
          experience: Number(document.getElementById("reg-experience").value) || 3,
          fee: Number(document.getElementById("reg-fee").value) || 600,
          bio: "Dedicated healthcare specialist at MedCare Hospital.",
          availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          availableSlots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
        });
        DB.set(KEYS.DOCTORS, doctors);
      } else {
        const patients = DB.get(KEYS.PATIENTS);
        patients.push({
          id,
          name: displayName,
          email,
          phone,
          age: Number(document.getElementById("reg-age").value) || 28,
          gender: document.getElementById("reg-gender").value,
          bloodGroup: document.getElementById("reg-blood").value,
          address: "Bengaluru, India"
        });
        DB.set(KEYS.PATIENTS, patients);
      }

      const newUser = { id, role, name: displayName, email, password, profileId: id };
      users.push(newUser);
      DB.set(KEYS.USERS, users);

      this.session = newUser;
      DB.set(KEYS.SESSION, { userId: newUser.id, role: newUser.role });
      Notifier.notify(newUser.id, `Welcome to MedCare Hospital, ${displayName}!`);
      Toast.show("Account created and signed in!", "success");
      this.showAppShell();
    },

    logout() {
      this.session = null;
      localStorage.removeItem(KEYS.SESSION);
      Toast.show("You have been logged out.", "info");
      this.showAuthView();
    },

    showAuthView() {
      document.getElementById("app-shell").classList.add("hidden");
      document.getElementById("auth-view").classList.remove("hidden");
    },

    showAppShell() {
      document.getElementById("auth-view").classList.add("hidden");
      document.getElementById("app-shell").classList.remove("hidden");

      document.getElementById("sidebar-role-badge").textContent = this.session.role;
      document.getElementById("sidebar-user-name").textContent = this.session.name;
      document.getElementById("sidebar-user-email").textContent = this.session.email;
      document.getElementById("sidebar-avatar").textContent = Utils.initials(this.session.name);

      this.buildSidebarNav();
      this.refreshTopbarBadges();
      this.navigate("dashboard");
    },

    getNavConfig() {
      const role = this.session.role;
      if (role === "patient") {
        return [
          { id: "dashboard", label: "Dashboard", icon: "&#127968;" },
          { id: "doctors", label: "Find Doctors", icon: "&#129658;" },
          { id: "appointments", label: "My Appointments", icon: "&#128197;" },
          { id: "payments", label: "Payments & Refunds", icon: "&#128179;" },
          { id: "reviews", label: "My Reviews", icon: "&#11088;" },
          { id: "support", label: "Customer Support", icon: "&#128172;" },
          { id: "profile", label: "My Profile", icon: "&#128100;" }
        ];
      }
      if (role === "doctor") {
        return [
          { id: "dashboard", label: "Dashboard", icon: "&#127968;" },
          { id: "appointments", label: "Appointments", icon: "&#128197;" },
          { id: "schedule", label: "Availability Schedule", icon: "&#128337;" },
          { id: "reviews", label: "Ratings & Reviews", icon: "&#11088;" },
          { id: "support", label: "Support & FAQ", icon: "&#128172;" },
          { id: "profile", label: "My Profile", icon: "&#128100;" }
        ];
      }
      return [
        { id: "dashboard", label: "Admin Dashboard", icon: "&#128202;" },
        { id: "manage-doctors", label: "Manage Doctors", icon: "&#129658;" },
        { id: "manage-patients", label: "Manage Patients", icon: "&#128101;" },
        { id: "all-appointments", label: "All Appointments", icon: "&#128197;" },
        { id: "all-payments", label: "All Payments", icon: "&#128179;" },
        { id: "manage-refunds", label: "Refund Requests", icon: "&#128184;" },
        { id: "manage-tickets", label: "Support Tickets", icon: "&#127915;" },
        { id: "analytics", label: "System Analytics", icon: "&#128200;" }
      ];
    },

    buildSidebarNav() {
      const nav = document.getElementById("sidebar-nav");
      nav.innerHTML = this.getNavConfig()
        .map(
          (item) => `
          <button class="nav-item" data-nav="${item.id}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </button>`
        )
        .join("");

      nav.querySelectorAll(".nav-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.navigate(btn.dataset.nav);
          this.toggleMobileSidebar(false);
        });
      });
    },

    navigate(pageId) {
      this.currentPage = pageId;
      document.querySelectorAll(".nav-item").forEach((el) => {
        el.classList.toggle("active", el.dataset.nav === pageId);
      });

      const role = this.session.role;
      const container = document.getElementById("main-content");
      container.innerHTML = "";

      if (role === "patient") PatientViews.render(pageId, container);
      else if (role === "doctor") DoctorViews.render(pageId, container);
      else AdminViews.render(pageId, container);
    },

    setHeader(title, subtitle) {
      document.getElementById("page-title").textContent = title;
      document.getElementById("page-subtitle").textContent = subtitle;
    },

    refreshTopbarBadges() {
      if (!this.session) return;
      const unread = DB.get(KEYS.NOTIFICATIONS).filter(
        (n) => n.userId === this.session.id && !n.read
      ).length;
      const badge = document.getElementById("notif-badge");
      badge.textContent = unread;
      badge.classList.toggle("hidden", unread === 0);

      const emails = DB.get(KEYS.EMAILS).filter(
        (e) => this.session.role === "admin" || e.to.toLowerCase() === this.session.email.toLowerCase()
      );
      const emailBadge = document.getElementById("email-badge");
      emailBadge.textContent = emails.length;
      emailBadge.classList.toggle("hidden", emails.length === 0);
    },

    renderNotificationsDropdown() {
      const listEl = document.getElementById("notif-list");
      const items = DB.get(KEYS.NOTIFICATIONS).filter((n) => n.userId === this.session.id);

      if (!items.length) {
        listEl.innerHTML = `<div class="empty-state">No notifications yet.</div>`;
        return;
      }

      listEl.innerHTML = items
        .map(
          (n) => `
          <div class="notif-item ${n.read ? "" : "unread"}" data-notif-id="${n.id}">
            <p>${Utils.escapeHtml(n.message)}</p>
            <small>${Utils.escapeHtml(n.createdAt)}</small>
          </div>`
        )
        .join("");

      listEl.querySelectorAll(".notif-item").forEach((el) => {
        el.addEventListener("click", () => {
          const all = DB.get(KEYS.NOTIFICATIONS).map((n) =>
            n.id === el.dataset.notifId ? { ...n, read: true } : n
          );
          DB.set(KEYS.NOTIFICATIONS, all);
          this.renderNotificationsDropdown();
          this.refreshTopbarBadges();
        });
      });
    },

    openEmailLogModal() {
      const emails = DB.get(KEYS.EMAILS).filter(
        (e) => this.session.role === "admin" || e.to.toLowerCase() === this.session.email.toLowerCase()
      );

      const content = !emails.length
        ? `<div class="empty-state">No simulated emails recorded yet.</div>`
        : emails
            .map(
              (em) => `
              <div class="card" style="padding:14px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
                  <strong>${Utils.escapeHtml(em.subject)}</strong>
                  <span class="muted-text">${Utils.escapeHtml(em.sentAt)}</span>
                </div>
                <div class="muted-text" style="margin-bottom:6px;">To: ${Utils.escapeHtml(em.to)}</div>
                <p style="font-size:0.88rem;">${Utils.escapeHtml(em.body)}</p>
              </div>`
            )
            .join("");

      Modal.open("Simulated Email Notifications", content);
    }
  };

  /* ==========================================================================
     8. SHARED SUPPORT MODULE (Tickets + Live Chat + FAQ)
     ========================================================================== */
  const SupportViews = {
    render(container) {
      App.setHeader("Customer Support", "Raise support tickets, chat live, or browse FAQs");
      const userId = App.session.id;
      const myTickets = DB.get(KEYS.TICKETS).filter((t) => t.userId === userId);
      const myChats = DB.get(KEYS.CHATS).filter((c) => c.userId === userId);

      container.innerHTML = `
        <div class="support-grid">
          <!-- Raise Support Ticket -->
          <div class="card">
            <div class="card-header"><h3>Raise a Support Ticket</h3></div>
            <form id="ticket-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="tkt-category">Category</label>
                  <select id="tkt-category" required>
                    <option value="Appointment Issue">Appointment Issue</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Refund Issue">Refund Issue</option>
                    <option value="Doctor Availability">Doctor Availability</option>
                    <option value="Account Issue">Account Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="tkt-priority">Priority</label>
                  <select id="tkt-priority" required>
                    <option value="Low">Low</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="tkt-subject">Subject</label>
                <input type="text" id="tkt-subject" placeholder="Brief summary of your issue" required />
              </div>
              <div class="form-group">
                <label for="tkt-desc">Description</label>
                <textarea id="tkt-desc" placeholder="Provide details so our team can assist faster..." required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Submit Ticket</button>
            </form>
          </div>

          <!-- Live Chat Support Simulation -->
          <div class="card">
            <div class="card-header">
              <h3>Live Chat Support</h3>
              <span class="status-badge status-approved">Online</span>
            </div>
            <div class="chat-box">
              <div id="chat-messages" class="chat-messages">
                ${
                  myChats.length
                    ? myChats
                        .map(
                          (c) => `
                          <div class="chat-msg ${c.sender}">
                            ${Utils.escapeHtml(c.text)}
                            <small>${Utils.escapeHtml(c.time)}</small>
                          </div>`
                        )
                        .join("")
                    : `<div class="chat-msg bot">Hello ${Utils.escapeHtml(App.session.name)}! How can MedCare Support help you today?<small>${Utils.nowFormatted()}</small></div>`
                }
              </div>
              <form id="chat-form" class="chat-input-bar">
                <input type="text" id="chat-input" placeholder="Type your message..." autocomplete="off" required />
                <button type="submit" class="btn btn-primary btn-sm">Send</button>
              </form>
            </div>
          </div>
        </div>

        <!-- Ticket History -->
        <div class="card">
          <div class="card-header"><h3>My Support Tickets (${myTickets.length})</h3></div>
          ${
            !myTickets.length
              ? `<div class="empty-state">You have not raised any support tickets yet.</div>`
              : `<div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Category</th>
                        <th>Subject</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Admin Reply</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${myTickets
                        .map(
                          (t) => `
                        <tr>
                          <td><strong>${t.id}</strong></td>
                          <td>${Utils.escapeHtml(t.category)}</td>
                          <td>
                            <strong>${Utils.escapeHtml(t.subject)}</strong>
                            <div class="muted-text">${Utils.escapeHtml(t.description)}</div>
                          </td>
                          <td><span class="status-badge ${Utils.statusClass(t.priority)}">${t.priority}</span></td>
                          <td><span class="status-badge ${Utils.statusClass(t.status)}">${t.status}</span></td>
                          <td>${t.adminReply ? Utils.escapeHtml(t.adminReply) : '<span class="muted-text">Awaiting response</span>'}</td>
                          <td>${t.createdAt}</td>
                        </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
          }
        </div>

        <!-- FAQ Accordion -->
        <div class="card">
          <div class="card-header"><h3>Frequently Asked Questions (FAQ)</h3></div>
          <div id="faq-container">
            ${FAQ_LIST.map(
              (f, idx) => `
              <div class="faq-item">
                <button type="button" class="faq-question" data-faq="${idx}">
                  <span>${Utils.escapeHtml(f.q)}</span>
                  <span>+</span>
                </button>
                <div class="faq-answer hidden" id="faq-ans-${idx}">${Utils.escapeHtml(f.a)}</div>
              </div>`
            ).join("")}
          </div>
        </div>
      `;

      // Bind ticket form
      document.getElementById("ticket-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const subject = document.getElementById("tkt-subject").value.trim();
        const desc = document.getElementById("tkt-desc").value.trim();
        if (!subject || !desc) {
          Toast.show("Please fill in subject and description.", "error");
          return;
        }
        const tickets = DB.get(KEYS.TICKETS);
        const newTkt = {
          id: Utils.uid("TKT"),
          userId: App.session.id,
          userRole: App.session.role,
          category: document.getElementById("tkt-category").value,
          priority: document.getElementById("tkt-priority").value,
          subject,
          description: desc,
          status: "Open",
          adminReply: "",
          createdAt: Utils.todayISO(),
          updatedAt: Utils.todayISO()
        };
        tickets.unshift(newTkt);
        DB.set(KEYS.TICKETS, tickets);

        Notifier.notify("ADM-1", `New ${newTkt.priority} priority ticket ${newTkt.id}: ${newTkt.subject}`);
        Toast.show(`Support ticket ${newTkt.id} submitted!`, "success");
        this.render(container);
      });

      // Bind chat form
      const chatMessagesEl = document.getElementById("chat-messages");
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

      document.getElementById("chat-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("chat-input");
        const text = input.value.trim();
        if (!text) return;

        const chats = DB.get(KEYS.CHATS);
        chats.push({ id: Utils.uid("CHT"), userId, sender: "user", text, time: Utils.nowFormatted() });
        const reply = generateBotReply(text);
        chats.push({ id: Utils.uid("CHT"), userId, sender: "bot", text: reply, time: Utils.nowFormatted() });
        DB.set(KEYS.CHATS, chats);

        input.value = "";
        this.render(container);
      });

      // Bind FAQ accordion
      container.querySelectorAll(".faq-question").forEach((btn) => {
        btn.addEventListener("click", () => {
          const ans = document.getElementById(`faq-ans-${btn.dataset.faq}`);
          ans.classList.toggle("hidden");
        });
      });
    }
  };

  /* ==========================================================================
     9. PATIENT VIEWS
     ========================================================================== */
  const PatientViews = {
    render(pageId, container) {
      switch (pageId) {
        case "dashboard": this.dashboard(container); break;
        case "doctors": this.findDoctors(container); break;
        case "appointments": this.appointments(container); break;
        case "payments": this.paymentsAndRefunds(container); break;
        case "reviews": this.reviews(container); break;
        case "support": SupportViews.render(container); break;
        case "profile": this.profile(container); break;
        default: this.dashboard(container);
      }
    },

    dashboard(container) {
      App.setHeader("Patient Dashboard", `Welcome, ${App.session.name}`);
      const pid = App.session.profileId;
      const myApts = DB.get(KEYS.APPOINTMENTS).filter((a) => a.patientId === pid);
      const myPays = DB.get(KEYS.PAYMENTS).filter((p) => p.patientId === pid);
      const myTickets = DB.get(KEYS.TICKETS).filter((t) => t.userId === pid && t.status !== "Closed");
      const totalSpent = myPays.reduce((s, p) => s + Number(p.amount), 0);
      const upcoming = myApts.filter((a) => ["Pending", "Approved"].includes(a.status)).length;
      const doctors = DB.get(KEYS.DOCTORS);

      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div><div class="stat-label">Total Appointments</div><div class="stat-value">${myApts.length}</div></div>
            <div class="stat-icon">&#128197;</div>
          </div>
          <div class="stat-card">
            <div><div class="stat-label">Upcoming Visits</div><div class="stat-value">${upcoming}</div></div>
            <div class="stat-icon">&#9200;</div>
          </div>
          <div class="stat-card">
            <div><div class="stat-label">Total Paid</div><div class="stat-value">${Utils.formatCurrency(totalSpent)}</div></div>
            <div class="stat-icon">&#128179;</div>
          </div>
          <div class="stat-card">
            <div><div class="stat-label">Active Tickets</div><div class="stat-value">${myTickets.length}</div></div>
            <div class="stat-icon">&#127915;</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Recent Appointments</h3>
            <button class="btn btn-primary btn-sm" id="quick-book-btn">+ Book New Appointment</button>
          </div>
          ${
            !myApts.length
              ? `<div class="empty-state">No appointments yet. Click 'Book New Appointment' to get started.</div>`
              : `<div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th><th>Doctor</th><th>Date &amp; Slot</th><th>Fee</th><th>Status</th><th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${myApts
                        .slice(0, 6)
                        .map((a) => {
                          const doc = doctors.find((d) => d.id === a.doctorId);
                          return `
                            <tr>
                              <td><strong>${a.id}</strong></td>
                              <td>${doc ? Utils.escapeHtml(doc.name) : "Doctor"}<div class="muted-text">${doc ? Utils.escapeHtml(doc.specialization) : ""}</div></td>
                              <td>${a.date} &bull; ${a.timeSlot}</td>
                              <td>${Utils.formatCurrency(a.fee)}</td>
                              <td><span class="status-badge ${Utils.statusClass(a.status)}">${a.status}</span></td>
                              <td><span class="status-badge ${Utils.statusClass(a.paymentStatus)}">${a.paymentStatus}</span></td>
                            </tr>`;
                        })
                        .join("")}
                    </tbody>
                  </table>
                </div>`
          }
        </div>
      `;

      document.getElementById("quick-book-btn").addEventListener("click", () => App.navigate("doctors"));
    },

    findDoctors(container) {
      App.setHeader("Find Doctors & Rankings", "Search specialists, compare ratings, and book slots");
      const allRanked = Utils.getRankedDoctors();
      const specs = [...new Set(allRanked.map((d) => d.specialization))].sort();

      container.innerHTML = `
        <div class="card">
          <div class="filters-bar">
            <input type="text" id="doc-search" placeholder="Search doctor by name or qualification..." />
            <select id="doc-spec-filter">
              <option value="">All Specializations</option>
              ${specs.map((s) => `<option value="${Utils.escapeHtml(s)}">${Utils.escapeHtml(s)}</option>`).join("")}
            </select>
            <select id="doc-sort">
              <option value="rating">Sort by Top Rated</option>
              <option value="fee-asc">Fee: Low to High</option>
              <option value="fee-desc">Fee: High to Low</option>
              <option value="exp">Most Experienced</option>
            </select>
          </div>
          <div id="doctors-list" class="doctors-grid"></div>
        </div>
      `;

      const renderList = () => {
        const q = document.getElementById("doc-search").value.trim().toLowerCase();
        const spec = document.getElementById("doc-spec-filter").value;
        const sort = document.getElementById("doc-sort").value;

        let list = Utils.getRankedDoctors().filter((d) => {
          const matchQ = !q || d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q) || d.qualification.toLowerCase().includes(q);
          const matchS = !spec || d.specialization === spec;
          return matchQ && matchS;
        });

        if (sort === "fee-asc") list.sort((a, b) => a.fee - b.fee);
        else if (sort === "fee-desc") list.sort((a, b) => b.fee - a.fee);
        else if (sort === "exp") list.sort((a, b) => b.experience - a.experience);

        const grid = document.getElementById("doctors-list");
        if (!list.length) {
          grid.innerHTML = `<div class="empty-state">No doctors match your search criteria.</div>`;
          return;
        }

        grid.innerHTML = list
          .map(
            (d) => `
            <div class="doctor-card">
              <div class="doctor-card-top">
                <div class="doctor-avatar">${Utils.initials(d.name)}</div>
                <div style="flex:1;">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <strong>${Utils.escapeHtml(d.name)}</strong>
                    <span class="rank-pill">#${d.rank} Ranked</span>
                  </div>
                  <div class="muted-text">${Utils.escapeHtml(d.specialization)} &bull; ${Utils.escapeHtml(d.qualification)}</div>
                  <div style="font-size:0.84rem; margin-top:2px;">
                    ${Utils.renderStars(d.avgRating)} <strong>${d.avgRating || "New"}</strong> <span class="muted-text">(${d.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
              <div class="doctor-meta">
                <div><span class="muted-text">Experience</span><br/><strong>${d.experience} Years</strong></div>
                <div><span class="muted-text">Consultation Fee</span><br/><strong>${Utils.formatCurrency(d.fee)}</strong></div>
              </div>
              <div class="actions-cell">
                <button class="btn btn-primary btn-sm" style="flex:1;" data-book-doc="${d.id}">Book Appointment</button>
                <button class="btn btn-secondary btn-sm" data-view-doc="${d.id}">Details</button>
              </div>
            </div>`
          )
          .join("");

        grid.querySelectorAll("[data-view-doc]").forEach((btn) => {
          btn.addEventListener("click", () => this.openDoctorDetailsModal(btn.dataset.viewDoc));
        });
        grid.querySelectorAll("[data-book-doc]").forEach((btn) => {
          btn.addEventListener("click", () => this.openBookingModal(btn.dataset.bookDoc));
        });
      };

      document.getElementById("doc-search").addEventListener("input", renderList);
      document.getElementById("doc-spec-filter").addEventListener("change", renderList);
      document.getElementById("doc-sort").addEventListener("change", renderList);
      renderList();
    },

    openDoctorDetailsModal(doctorId) {
      const doc = Utils.getRankedDoctors().find((d) => d.id === doctorId);
      if (!doc) return;
      const reviews = DB.get(KEYS.REVIEWS).filter((r) => r.doctorId === doctorId);
      const patients = DB.get(KEYS.PATIENTS);

      Modal.open(
        doc.name,
        `
        <div style="display:flex; gap:14px; align-items:center; margin-bottom:14px;">
          <div class="doctor-avatar">${Utils.initials(doc.name)}</div>
          <div>
            <strong>${Utils.escapeHtml(doc.specialization)}</strong> &bull; ${Utils.escapeHtml(doc.qualification)}
            <div>${Utils.renderStars(doc.avgRating)} <strong>${doc.avgRating || "No ratings"}</strong> (${doc.reviewCount} reviews) &bull; <span class="rank-pill">Rank #${doc.rank}</span></div>
          </div>
        </div>
        <p style="margin-bottom:14px; font-size:0.9rem;">${Utils.escapeHtml(doc.bio)}</p>
        <div class="doctor-meta" style="margin-bottom:16px;">
          <div><span class="muted-text">Consultation Fee</span><br/><strong>${Utils.formatCurrency(doc.fee)}</strong></div>
          <div><span class="muted-text">Experience</span><br/><strong>${doc.experience} Years</strong></div>
          <div><span class="muted-text">Available Days</span><br/><strong>${doc.availableDays.join(", ")}</strong></div>
          <div><span class="muted-text">Phone</span><br/><strong>${Utils.escapeHtml(doc.phone)}</strong></div>
        </div>
        <h4 style="margin-bottom:8px;">Patient Reviews</h4>
        ${
          !reviews.length
            ? `<p class="muted-text">No reviews submitted yet.</p>`
            : reviews
                .map((r) => {
                  const pat = patients.find((p) => p.id === r.patientId);
                  return `
                    <div class="card" style="padding:12px; margin-bottom:8px;">
                      <div style="display:flex; justify-content:space-between;">
                        <strong>${pat ? Utils.escapeHtml(pat.name) : "Patient"}</strong>
                        <span>${Utils.renderStars(r.rating)}</span>
                      </div>
                      <p style="font-size:0.86rem; margin-top:4px;">${Utils.escapeHtml(r.comment)}</p>
                      <small class="muted-text">${r.date}</small>
                    </div>`;
                })
                .join("")
        }
        <button class="btn btn-primary btn-block" id="modal-book-now-btn" style="margin-top:10px;">Book Appointment with ${Utils.escapeHtml(doc.name)}</button>
      `
      );

      document.getElementById("modal-book-now-btn").addEventListener("click", () => {
        Modal.close();
        this.openBookingModal(doc.id);
      });
    },

    openBookingModal(doctorId) {
      const doc = DB.get(KEYS.DOCTORS).find((d) => d.id === doctorId);
      if (!doc) return;
      const today = Utils.todayISO();

      Modal.open(
        `Book Appointment — ${doc.name}`,
        `
        <form id="booking-form">
          <div class="doctor-meta" style="margin-bottom:14px;">
            <div><span class="muted-text">Specialization</span><br/><strong>${Utils.escapeHtml(doc.specialization)}</strong></div>
            <div><span class="muted-text">Consultation Fee</span><br/><strong>${Utils.formatCurrency(doc.fee)}</strong></div>
          </div>
          <div class="form-group">
            <label for="book-date">Select Date</label>
            <input type="date" id="book-date" min="${today}" value="${today}" required />
          </div>
          <div class="form-group">
            <label>Select Available Time Slot</label>
            <div id="book-slots-grid" class="slots-grid"></div>
            <input type="hidden" id="book-selected-slot" required />
          </div>
          <div class="form-group">
            <label for="book-reason">Symptoms / Reason for Visit</label>
            <textarea id="book-reason" placeholder="Briefly describe your symptoms or consultation purpose..." required></textarea>
          </div>
          <div id="book-error" class="form-error hidden"></div>
          <button type="submit" class="btn btn-primary btn-block">Confirm Booking</button>
        </form>
      `
      );

      const renderSlots = () => {
        const chosenDate = document.getElementById("book-date").value;
        const bookedSlots = DB.get(KEYS.APPOINTMENTS)
          .filter((a) => a.doctorId === doc.id && a.date === chosenDate && !["Cancelled", "Rejected"].includes(a.status))
          .map((a) => a.timeSlot);

        const slotsGrid = document.getElementById("book-slots-grid");
        document.getElementById("book-selected-slot").value = "";

        if (!doc.availableSlots.length) {
          slotsGrid.innerHTML = `<p class="muted-text">Doctor has no configured time slots.</p>`;
          return;
        }

        slotsGrid.innerHTML = doc.availableSlots
          .map((slot) => {
            const isBooked = bookedSlots.includes(slot);
            return `<button type="button" class="slot-chip ${isBooked ? "booked" : ""}" ${isBooked ? "disabled" : ""} data-slot="${slot}">${slot}${isBooked ? " (Booked)" : ""}</button>`;
          })
          .join("");

        slotsGrid.querySelectorAll(".slot-chip:not(:disabled)").forEach((chip) => {
          chip.addEventListener("click", () => {
            slotsGrid.querySelectorAll(".slot-chip").forEach((c) => c.classList.remove("selected"));
            chip.classList.add("selected");
            document.getElementById("book-selected-slot").value = chip.dataset.slot;
          });
        });
      };

      document.getElementById("book-date").addEventListener("change", renderSlots);
      renderSlots();

      document.getElementById("booking-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const date = document.getElementById("book-date").value;
        const slot = document.getElementById("book-selected-slot").value;
        const reason = document.getElementById("book-reason").value.trim();
        const errEl = document.getElementById("book-error");
        errEl.classList.add("hidden");

        if (!date || !slot || !reason) {
          errEl.textContent = "Please select a date, an available time slot, and enter your reason for visit.";
          errEl.classList.remove("hidden");
          return;
        }

        const appointments = DB.get(KEYS.APPOINTMENTS);
        // Duplicate booking prevention check
        const duplicate = appointments.some(
          (a) =>
            a.doctorId === doc.id &&
            a.date === date &&
            a.timeSlot === slot &&
            !["Cancelled", "Rejected"].includes(a.status)
        );
        if (duplicate) {
          errEl.textContent = "This slot is already booked. Please choose another time slot.";
          errEl.classList.remove("hidden");
          renderSlots();
          return;
        }

        const newApt = {
          id: Utils.uid("APT"),
          patientId: App.session.profileId,
          doctorId: doc.id,
          date,
          timeSlot: slot,
          reason,
          status: "Pending",
          paymentStatus: "Unpaid",
          fee: doc.fee,
          createdAt: Utils.todayISO()
        };
        appointments.unshift(newApt);
        DB.set(KEYS.APPOINTMENTS, appointments);

        Notifier.notify(App.session.id, `Appointment ${newApt.id} booked with ${doc.name} on ${date} at ${slot}.`);
        Notifier.notify(doc.id, `New appointment request ${newApt.id} from ${App.session.name} on ${date} at ${slot}.`);
        Notifier.sendEmail(
          App.session.email,
          `Appointment Booked — ${newApt.id}`,
          `Hello ${App.session.name}, your appointment (${newApt.id}) with ${doc.name} on ${date} at ${slot} is confirmed as Pending approval.`
        );

        Modal.close();
        Toast.show(`Appointment ${newApt.id} booked successfully!`, "success");
        App.navigate("appointments");
      });
    },

    appointments(container) {
      App.setHeader("My Appointments", "Track status, make payments, cancel bookings, or leave reviews");
      const pid = App.session.profileId;
      const doctors = DB.get(KEYS.DOCTORS);

      container.innerHTML = `
        <div class="card">
          <div class="filters-bar">
            <select id="pat-apt-filter">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button class="btn btn-primary btn-sm" id="pat-new-apt-btn">+ Book Appointment</button>
          </div>
          <div id="pat-apt-table"></div>
        </div>
      `;

      document.getElementById("pat-new-apt-btn").addEventListener("click", () => App.navigate("doctors"));

      const renderTable = () => {
        const statusFilter = document.getElementById("pat-apt-filter").value;
        const reviews = DB.get(KEYS.REVIEWS);
        const refunds = DB.get(KEYS.REFUNDS);
        const list = DB.get(KEYS.APPOINTMENTS).filter(
          (a) => a.patientId === pid && (!statusFilter || a.status === statusFilter)
        );

        const target = document.getElementById("pat-apt-table");
        if (!list.length) {
          target.innerHTML = `<div class="empty-state">No appointments found.</div>`;
          return;
        }

        target.innerHTML = `
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Doctor</th><th>Date &amp; Slot</th><th>Reason</th><th>Fee</th><th>Status</th><th>Payment</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list
                  .map((a) => {
                    const doc = doctors.find((d) => d.id === a.doctorId);
                    const hasReviewed = reviews.some((r) => r.appointmentId === a.id);
                    const hasRefund = refunds.some((r) => r.appointmentId === a.id);
                    return `
                      <tr>
                        <td><strong>${a.id}</strong></td>
                        <td>${doc ? Utils.escapeHtml(doc.name) : "Doctor"}<div class="muted-text">${doc ? Utils.escapeHtml(doc.specialization) : ""}</div></td>
                        <td>${a.date}<div class="muted-text">${a.timeSlot}</div></td>
                        <td>${Utils.escapeHtml(a.reason)}</td>
                        <td>${Utils.formatCurrency(a.fee)}</td>
                        <td><span class="status-badge ${Utils.statusClass(a.status)}">${a.status}</span></td>
                        <td><span class="status-badge ${Utils.statusClass(a.paymentStatus)}">${a.paymentStatus}</span></td>
                        <td class="actions-cell">
                          ${a.paymentStatus === "Unpaid" && ["Pending", "Approved"].includes(a.status) ? `<button class="btn btn-success btn-sm" data-pay-apt="${a.id}">Pay Now</button>` : ""}
                          ${["Pending", "Approved"].includes(a.status) ? `<button class="btn btn-danger-outline btn-sm" data-cancel-apt="${a.id}">Cancel</button>` : ""}
                          ${a.paymentStatus === "Paid" && ["Cancelled", "Rejected"].includes(a.status) && !hasRefund ? `<button class="btn btn-warning btn-sm" data-refund-apt="${a.id}">Request Refund</button>` : ""}
                          ${a.status === "Completed" && !hasReviewed ? `<button class="btn btn-primary btn-sm" data-review-apt="${a.id}">Rate &amp; Review</button>` : ""}
                        </td>
                      </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `;

        target.querySelectorAll("[data-pay-apt]").forEach((btn) => {
          btn.addEventListener("click", () => this.openPaymentModal(btn.dataset.payApt));
        });
        target.querySelectorAll("[data-cancel-apt]").forEach((btn) => {
          btn.addEventListener("click", () => this.cancelAppointment(btn.dataset.cancelApt, renderTable));
        });
        target.querySelectorAll("[data-refund-apt]").forEach((btn) => {
          btn.addEventListener("click", () => this.openRefundModal(btn.dataset.refundApt));
        });
        target.querySelectorAll("[data-review-apt]").forEach((btn) => {
          btn.addEventListener("click", () => this.openReviewModal(btn.dataset.reviewApt));
        });
      };

      document.getElementById("pat-apt-filter").addEventListener("change", renderTable);
      renderTable();
    },

    cancelAppointment(aptId, onDone) {
      if (!confirm(`Are you sure you want to cancel appointment ${aptId}?`)) return;
      const all = DB.get(KEYS.APPOINTMENTS);
      const apt = all.find((a) => a.id === aptId);
      if (!apt) return;

      apt.status = "Cancelled";
      DB.set(KEYS.APPOINTMENTS, all);

      const doc = DB.get(KEYS.DOCTORS).find((d) => d.id === apt.doctorId);
      Notifier.notify(App.session.id, `Appointment ${apt.id} has been cancelled.`);
      if (doc) Notifier.notify(doc.id, `Patient ${App.session.name} cancelled appointment ${apt.id}.`);
      Notifier.sendEmail(
        App.session.email,
        `Appointment Cancelled — ${apt.id}`,
        `Hello ${App.session.name}, your appointment ${apt.id} with ${doc ? doc.name : "your doctor"} on ${apt.date} at ${apt.timeSlot} has been cancelled.`
      );

      Toast.show(`Appointment ${apt.id} cancelled.`, "warning");
      if (onDone) onDone();
    },

    openPaymentModal(aptId) {
      const apt = DB.get(KEYS.APPOINTMENTS).find((a) => a.id === aptId);
      if (!apt) return;
      const doc = DB.get(KEYS.DOCTORS).find((d) => d.id === apt.doctorId);

      Modal.open(
        `Complete Payment — ${apt.id}`,
        `
        <div class="doctor-meta" style="margin-bottom:14px;">
          <div><span class="muted-text">Doctor</span><br/><strong>${doc ? Utils.escapeHtml(doc.name) : ""}</strong></div>
          <div><span class="muted-text">Amount Payable</span><br/><strong>${Utils.formatCurrency(apt.fee)}</strong></div>
        </div>
        <form id="payment-form">
          <div class="form-group">
            <label for="pay-method">Payment Method</label>
            <select id="pay-method" required>
              <option value="UPI">UPI</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>
          <div id="pay-method-fields"></div>
          <div id="pay-error" class="form-error hidden"></div>
          <button type="submit" class="btn btn-success btn-block">Pay ${Utils.formatCurrency(apt.fee)}</button>
        </form>
      `
      );

      const renderMethodFields = () => {
        const method = document.getElementById("pay-method").value;
        const wrap = document.getElementById("pay-method-fields");
        if (method === "UPI") {
          wrap.innerHTML = `<div class="form-group"><label for="pay-upi">UPI ID</label><input type="text" id="pay-upi" placeholder="e.g. aarav@upi" required /></div>`;
        } else if (method === "Net Banking") {
          wrap.innerHTML = `
            <div class="form-group">
              <label for="pay-bank">Select Bank</label>
              <select id="pay-bank" required>
                <option value="SBI">State Bank of India (SBI)</option>
                <option value="HDFC">HDFC Bank</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="Axis">Axis Bank</option>
                <option value="Kotak">Kotak Mahindra Bank</option>
              </select>
            </div>`;
        } else {
          wrap.innerHTML = `
            <div class="form-group"><label for="pay-card">Card Number (16 digits)</label><input type="text" id="pay-card" maxlength="19" placeholder="4532 1100 2299 8844" required /></div>
            <div class="form-row">
              <div class="form-group"><label for="pay-exp">Expiry (MM/YY)</label><input type="text" id="pay-exp" maxlength="5" placeholder="08/29" required /></div>
              <div class="form-group"><label for="pay-cvv">CVV</label><input type="password" id="pay-cvv" maxlength="3" placeholder="123" required /></div>
            </div>`;
        }
      };

      document.getElementById("pay-method").addEventListener("change", renderMethodFields);
      renderMethodFields();

      document.getElementById("payment-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const method = document.getElementById("pay-method").value;
        const err = document.getElementById("pay-error");
        err.classList.add("hidden");

        if (method === "UPI") {
          const upi = document.getElementById("pay-upi").value.trim();
          if (!upi.includes("@")) {
            err.textContent = "Enter a valid UPI ID (e.g. name@upi).";
            err.classList.remove("hidden");
            return;
          }
        } else if (method === "Debit Card" || method === "Credit Card") {
          const card = document.getElementById("pay-card").value.replace(/\s+/g, "");
          const cvv = document.getElementById("pay-cvv").value.trim();
          if (!/^[0-9]{16}$/.test(card) || !/^[0-9]{3}$/.test(cvv)) {
            err.textContent = "Enter a valid 16-digit card number and 3-digit CVV.";
            err.classList.remove("hidden");
            return;
          }
        }

        const txnId = Utils.txnId();
        const payments = DB.get(KEYS.PAYMENTS);
        payments.unshift({
          id: Utils.uid("PAY"),
          transactionId: txnId,
          appointmentId: apt.id,
          patientId: App.session.profileId,
          doctorId: apt.doctorId,
          amount: apt.fee,
          method,
          status: "Paid",
          date: Utils.todayISO()
        });
        DB.set(KEYS.PAYMENTS, payments);

        const allApts = DB.get(KEYS.APPOINTMENTS).map((a) =>
          a.id === apt.id ? { ...a, paymentStatus: "Paid" } : a
        );
        DB.set(KEYS.APPOINTMENTS, allApts);

        Notifier.notify(App.session.id, `Payment of ${Utils.formatCurrency(apt.fee)} successful (${txnId}).`);
        Notifier.sendEmail(
          App.session.email,
          `Payment Receipt — ${txnId}`,
          `Thank you ${App.session.name}! Your payment of ${Utils.formatCurrency(apt.fee)} via ${method} for appointment ${apt.id} was successful. Transaction ID: ${txnId}.`
        );

        Modal.close();
        Toast.show(`Payment successful! TXN: ${txnId}`, "success");
        App.navigate("appointments");
      });
    },

    openRefundModal(aptId) {
      const payment = DB.get(KEYS.PAYMENTS).find((p) => p.appointmentId === aptId);
      if (!payment) {
        Toast.show("No payment record found for this appointment.", "error");
        return;
      }

      Modal.open(
        `Request Refund — ${aptId}`,
        `
        <form id="refund-req-form">
          <div class="doctor-meta" style="margin-bottom:14px;">
            <div><span class="muted-text">Transaction ID</span><br/><strong>${payment.transactionId}</strong></div>
            <div><span class="muted-text">Refund Amount</span><br/><strong>${Utils.formatCurrency(payment.amount)}</strong></div>
          </div>
          <div class="form-group">
            <label for="refund-reason">Reason for Refund</label>
            <textarea id="refund-reason" placeholder="Explain why you are requesting a refund..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Submit Refund Request</button>
        </form>
      `
      );

      document.getElementById("refund-req-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const reason = document.getElementById("refund-reason").value.trim();
        if (!reason) return;

        const refunds = DB.get(KEYS.REFUNDS);
        const newRef = {
          id: Utils.uid("REF"),
          paymentId: payment.id,
          appointmentId: aptId,
          patientId: App.session.profileId,
          amount: payment.amount,
          reason,
          status: "Pending",
          requestedAt: Utils.todayISO(),
          adminNote: ""
        };
        refunds.unshift(newRef);
        DB.set(KEYS.REFUNDS, refunds);

        Notifier.notify("ADM-1", `New refund request ${newRef.id} (${Utils.formatCurrency(newRef.amount)}) from ${App.session.name}.`);
        Modal.close();
        Toast.show(`Refund request ${newRef.id} submitted!`, "success");
        App.navigate("payments");
      });
    },

    paymentsAndRefunds(container) {
      App.setHeader("Payments & Refunds", "View your transaction history and refund request status");
      const pid = App.session.profileId;
      const myPayments = DB.get(KEYS.PAYMENTS).filter((p) => p.patientId === pid);
      const myRefunds = DB.get(KEYS.REFUNDS).filter((r) => r.patientId === pid);
      const doctors = DB.get(KEYS.DOCTORS);

      container.innerHTML = `
        <div class="card">
          <div class="card-header"><h3>Payment History (${myPayments.length})</h3></div>
          ${
            !myPayments.length
              ? `<div class="empty-state">No payments recorded yet.</div>`
              : `<div class="table-responsive">
                  <table>
                    <thead>
                      <tr><th>Transaction ID</th><th>Appointment</th><th>Doctor</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      ${myPayments
                        .map((p) => {
                          const doc = doctors.find((d) => d.id === p.doctorId);
                          const alreadyRef = myRefunds.some((r) => r.paymentId === p.id);
                          return `
                            <tr>
                              <td><strong>${p.transactionId}</strong></td>
                              <td>${p.appointmentId}</td>
                              <td>${doc ? Utils.escapeHtml(doc.name) : "Doctor"}</td>
                              <td>${p.method}</td>
                              <td><strong>${Utils.formatCurrency(p.amount)}</strong></td>
                              <td><span class="status-badge status-paid">${p.status}</span></td>
                              <td>${p.date}</td>
                              <td>
                                ${!alreadyRef ? `<button class="btn btn-secondary btn-sm" data-ref-apt="${p.appointmentId}">Request Refund</button>` : `<span class="muted-text">Refund Requested</span>`}
                              </td>
                            </tr>`;
                        })
                        .join("")}
                    </tbody>
                  </table>
                </div>`
          }
        </div>

        <div class="card">
          <div class="card-header"><h3>Refund History (${myRefunds.length})</h3></div>
          ${
            !myRefunds.length
              ? `<div class="empty-state">No refund requests submitted.</div>`
              : `<div class="table-responsive">
                  <table>
                    <thead>
                      <tr><th>Refund ID</th><th>Appointment</th><th>Amount</th><th>Reason</th><th>Status</th><th>Admin Note</th><th>Requested</th></tr>
                    </thead>
                    <tbody>
                      ${myRefunds
                        .map(
                          (r) => `
                        <tr>
                          <td><strong>${r.id}</strong></td>
                          <td>${r.appointmentId}</td>
                          <td><strong>${Utils.formatCurrency(r.amount)}</strong></td>
                          <td>${Utils.escapeHtml(r.reason)}</td>
                          <td><span class="status-badge ${Utils.statusClass(r.status)}">${r.status}</span></td>
                          <td>${r.adminNote ? Utils.escapeHtml(r.adminNote) : '<span class="muted-text">—</span>'}</td>
                          <td>${r.requestedAt}</td>
                        </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>`
          }
        </div>
      `;

      container.querySelectorAll("[data-ref-apt]").forEach((btn) => {
        btn.addEventListener("click", () => this.openRefundModal(btn.dataset.refApt));
      });
    },

    openReviewModal(aptId) {
      const apt = DB.get(KEYS.APPOINTMENTS).find((a) => a.id === aptId);
      if (!apt) return;
      const doc = DB.get(KEYS.DOCTORS).find((d) => d.id === apt.doctorId);

      Modal.open(
        `Rate & Review — ${doc ? doc.name : "Doctor"}`,
        `
        <form id="review-form">
          <div class="form-group">
            <label>Your Rating (1 to 5 Stars)</label>
            <div class="star-picker" id="star-picker">
              ${[1, 2, 3, 4, 5].map((n) => `<span data-star="${n}" class="${n <= 5 ? "active" : ""}">&#9733;</span>`).join("")}
            </div>
            <input type="hidden" id="review-rating" value="5" />
          </div>
          <div class="form-group">
            <label for="review-comment">Your Review</label>
            <textarea id="review-comment" placeholder="Share your consultation experience..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Submit Review</button>
        </form>
      `
      );

      const stars = document.querySelectorAll("#star-picker span");
      stars.forEach((s) => {
        s.addEventListener("click", () => {
          const val = Number(s.dataset.star);
          document.getElementById("review-rating").value = val;
          stars.forEach((st) => st.classList.toggle("active", Number(st.dataset.star) <= val));
        });
      });

      document.getElementById("review-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const rating = Number(document.getElementById("review-rating").value);
        const comment = document.getElementById("review-comment").value.trim();
        if (!comment) return;

        const reviews = DB.get(KEYS.REVIEWS);
        reviews.unshift({
          id: Utils.uid("REV"),
          doctorId: apt.doctorId,
          patientId: App.session.profileId,
          appointmentId: apt.id,
          rating,
          comment,
          date: Utils.todayISO()
        });
        DB.set(KEYS.REVIEWS, reviews);

        Notifier.notify(apt.doctorId, `You received a ${rating}-star review from ${App.session.name}.`);
        Modal.close();
        Toast.show("Thank you! Your review has been published.", "success");
        App.navigate("reviews");
      });
    },

    reviews(container) {
      App.setHeader("My Reviews & Doctor Rankings", "View your submitted reviews and top-rated doctors");
      const pid = App.session.profileId;
      const myReviews = DB.get(KEYS.REVIEWS).filter((r) => r.patientId === pid);
      const doctors = DB.get(KEYS.DOCTORS);
      const eligibleApts = DB.get(KEYS.APPOINTMENTS).filter(
        (a) => a.patientId === pid && a.status === "Completed" && !myReviews.some((r) => r.appointmentId === a.id)
      );

      container.innerHTML = `
        ${
          eligibleApts.length
            ? `<div class="card">
                <div class="card-header"><h3>Pending Reviews for Completed Visits</h3></div>
                <div class="actions-cell">
                  ${eligibleApts
                    .map((a) => {
                      const doc = doctors.find((d) => d.id === a.doctorId);
                      return `<button class="btn btn-primary btn-sm" data-rate-apt="${a.id}">Rate ${doc ? Utils.escapeHtml(doc.name) : a.id} (${a.date})</button>`;
                    })
                    .join("")}
                </div>
              </div>`
            : ""
        }

        <div class="card">
          <div class="card-header"><h3>My Review History (${myReviews.length})</h3></div>
          ${
            !myReviews.length
              ? `<div class="empty-state">You haven't submitted any reviews yet.</div>`
              : `<div class="table-responsive">
                  <table>
                    <thead><tr><th>Doctor</th><th>Rating</th><th>Review</th><th>Date</th></tr></thead>
                    <tbody>
                      ${myReviews
                        .map((r) => {
                          const doc = doctors.find((d) => d.id === r.doctorId);
                          return `
                            <tr>
                              <td><strong>${doc ? Utils.escapeHtml(doc.name) : "Doctor"}</strong><div class="muted-text">${doc ? Utils.escapeHtml(doc.specialization) : ""}</div></td>
                              <td>${Utils.renderStars(r.rating)} (${r.rating}/5)</td>
                              <td>${Utils.escapeHtml(r.comment)}</td>
                              <td>${r.date}</td>
                            </tr>`;
                        })
                        .join("")}
                    </tbody>
                  </table>
                </div>`
          }
        </div>
      `;

      container.querySelectorAll("[data-rate-apt]").forEach((btn) => {
        btn.addEventListener("click", () => this.openReviewModal(btn.dataset.rateApt));
      });
    },

    profile(container) {
      App.setHeader("My Profile", "View and update your personal details");
      const patients = DB.get(KEYS.PATIENTS);
      const pat = patients.find((p) => p.id === App.session.profileId);
      if (!pat) return;

      container.innerHTML = `
        <div class="card" style="max-width:700px;">
          <form id="pat-profile-form">
            <div class="form-row">
              <div class="form-group"><label>Full Name</label><input type="text" id="pp-name" value="${Utils.escapeHtml(pat.name)}" required /></div>
              <div class="form-group"><label>Email</label><input type="email" value="${Utils.escapeHtml(pat.email)}" disabled /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Phone</label><input type="tel" id="pp-phone" value="${Utils.escapeHtml(pat.phone)}" required /></div>
              <div class="form-group"><label>Age</label><input type="number" id="pp-age" value="${pat.age}" min="1" max="120" required /></div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Gender</label>
                <select id="pp-gender">
                  ${["Male", "Female", "Other"].map((g) => `<option value="${g}" ${pat.gender === g ? "selected" : ""}>${g}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label>Blood Group</label>
                <select id="pp-blood">
                  ${["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => `<option value="${b}" ${pat.bloodGroup === b ? "selected" : ""}>${b}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="form-group"><label>Address</label><input type="text" id="pp-address" value="${Utils.escapeHtml(pat.address)}" /></div>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </form>
        </div>
      `;

      document.getElementById("pat-profile-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("pp-name").value.trim();
        const phone = document.getElementById("pp-phone").value.trim();
        if (!name || !Utils.validatePhone(phone)) {
          Toast.show("Enter a valid name and 10-digit phone number.", "error");
          return;
        }
        pat.name = name;
        pat.phone = phone;
        pat.age = Number(document.getElementById("pp-age").value);
        pat.gender = document.getElementById("pp-gender").value;
        pat.bloodGroup = document.getElementById("pp-blood").value;
        pat.address = document.getElementById("pp-address").value.trim();
        DB.set(KEYS.PATIENTS, patients);

        const users = DB.get(KEYS.USERS).map((u) => (u.id === App.session.id ? { ...u, name } : u));
        DB.set(KEYS.USERS, users);
        App.session.name = name;
        document.getElementById("sidebar-user-name").textContent = name;
        document.getElementById("sidebar-avatar").textContent = Utils.initials(name);
        Toast.show("Profile updated successfully!", "success");
      });
    }
  };

  /* ==========================================================================
     10. DOCTOR VIEWS
     ========================================================================== */
  const DoctorViews = {
    render(pageId, container) {
      switch (pageId) {
        case "dashboard": this.dashboard(container); break;
        case "appointments": this.appointments(container); break;
        case "schedule": this.schedule(container); break;
        case "reviews": this.reviews(container); break;
        case "support": SupportViews.render(container); break;
        case "profile": this.profile(container); break;
        default: this.dashboard(container);
      }
    },

    dashboard(container) {
      App.setHeader("Doctor Dashboard", `Welcome, ${App.session.name}`);
      const did = App.session.profileId;
      const myApts = DB.get(KEYS.APPOINTMENTS).filter((a) => a.doctorId === did);
      const pending = myApts.filter((a) => a.status === "Pending");
      const completed = myApts.filter((a) => a.status === "Completed").length;
      const rating = Utils.getDoctorRatingStats(did);
      const patients = DB.get(KEYS.PATIENTS);

      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div><div class="stat-label">Total Appointments</div><div class="stat-value">${myApts.length}</div></div><div class="stat-icon">&#128197;</div></div>
          <div class="stat-card"><div><div class="stat-label">Pending Requests</div><div class="stat-value">${pending.length}</div></div><div class="stat-icon">&#9203;</div></div>
          <div class="stat-card"><div><div class="stat-label">Completed</div><div class="stat-value">${completed}</div></div><div class="stat-icon">&#9989;</div></div>
          <div class="stat-card"><div><div class="stat-label">Average Rating</div><div class="stat-value">${rating.avg || "—"} &#9733;</div></div><div class="stat-icon">&#11088;</div></div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Pending Appointment Requests</h3>
            <button class="btn btn-secondary btn-sm" id="doc-view-all-btn">View All Appointments</button>
          </div>
          ${
            !pending.length
              ? `<div class="empty-state">No pending requests right now.</div>`
              : `<div class="table-responsive">
                  <table>
                    <thead><tr><th>ID</th><th>Patient</th><th>Date &amp; Slot</th><th>Reason</th><th>Actions</th></tr></thead>
                    <tbody>
                      ${pending
                        .map((a) => {
                          const pat = patients.find((p) => p.id === a.patientId);
                          return `
                            <tr>
                              <td><strong>${a.id}</strong></td>
                              <td>${pat ? Utils.escapeHtml(pat.name) : "Patient"}<div class="muted-text">${pat ? pat.phone : ""}</div></td>
                              <td>${a.date} &bull; ${a.timeSlot}</td>
                              <td>${Utils.escapeHtml(a.reason)}</td>
                              <td class="actions-cell">
                                <button class="btn btn-success btn-sm" data-doc-action="Approved" data-apt="${a.id}">Accept</button>
                                <button class="btn btn-danger btn-sm" data-doc-action="Rejected" data-apt="${a.id}">Reject</button>
                              </td>
                            </tr>`;
                        })
                        .join("")}
                    </tbody>
                  </table>
                </div>`
          }
        </div>
      `;

      document.getElementById("doc-view-all-btn").addEventListener("click", () => App.navigate("appointments"));
      container.querySelectorAll("[data-doc-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.updateAppointmentStatus(btn.dataset.apt, btn.dataset.docAction);
          this.dashboard(container);
        });
      });
    },

    updateAppointmentStatus(aptId, newStatus) {
      const all = DB.get(KEYS.APPOINTMENTS);
      const apt = all.find((a) => a.id === aptId);
      if (!apt) return;

      apt.status = newStatus;
      DB.set(KEYS.APPOINTMENTS, all);

      const pat = DB.get(KEYS.PATIENTS).find((p) => p.id === apt.patientId);
      Notifier.notify(apt.patientId, `Your appointment ${apt.id} with ${App.session.name} is now ${newStatus}.`);

      if (pat && newStatus === "Approved") {
        Notifier.sendEmail(
          pat.email,
          `Appointment Approved — ${apt.id}`,
          `Hello ${pat.name}, ${App.session.name} has approved your appointment (${apt.id}) scheduled for ${apt.date} at ${apt.timeSlot}.`
        );
      }

      Toast.show(`Appointment ${apt.id} marked as ${newStatus}.`, "success");
    },

    appointments(container) {
      App.setHeader("Manage Appointments", "Accept, reject, or mark patient consultations as completed");
      const did = App.session.profileId;
      const patients = DB.get(KEYS.PATIENTS);

      container.innerHTML = `
        <div class="card">
          <div class="filters-bar">
            <select id="doc-apt-filter">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div id="doc-apt-table"></div>
        </div>
      `;

      const renderTable = () => {
        const status = document.getElementById("doc-apt-filter").value;
        const list = DB.get(KEYS.APPOINTMENTS).filter(
          (a) => a.doctorId === did && (!status || a.status === status)
        );
        const target = document.getElementById("doc-apt-table");
        if (!list.length) {
          target.innerHTML = `<div class="empty-state">No appointments found.</div>`;
          return;
        }

        target.innerHTML = `
          <div class="table-responsive">
            <table>
              <thead><tr><th>ID</th><th>Patient</th><th>Date &amp; Slot</th><th>Reason</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                ${list
                  .map((a) => {
                    const pat = patients.find((p) => p.id === a.patientId);
                    return `
                      <tr>
                        <td><strong>${a.id}</strong></td>
                        <td>${pat ? Utils.escapeHtml(pat.name) : "Patient"}<div class="muted-text">${pat ? `${pat.age}y, ${pat.gender}` : ""}</div></td>
                        <td>${a.date}<div class="muted-text">${a.timeSlot}</div></td>
                        <td>${Utils.escapeHtml(a.reason)}</td>
                        <td><span class="status-badge ${Utils.statusClass(a.paymentStatus)}">${a.paymentStatus}</span></td>
                        <td><span class="status-badge ${Utils.statusClass(a.status)}">${a.status}</span></td>
                        <td class="actions-cell">
                          ${a.status === "Pending" ? `<button class="btn btn-success btn-sm" data-act="Approved" data-id="${a.id}">Accept</button><button class="btn btn-danger btn-sm" data-act="Rejected" data-id="${a.id}">Reject</button>` : ""}
                          ${a.status === "Approved" ? `<button class="btn btn-primary btn-sm" data-act="Completed" data-id="${a.id}">Mark Completed</button>` : ""}
                        </td>
                      </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `;

        target.querySelectorAll("[data-act]").forEach((btn) => {
          btn.addEventListener("click", () => {
            this.updateAppointmentStatus(btn.dataset.id, btn.dataset.act);
            renderTable();
          });
        });
      };

      document.getElementById("doc-apt-filter").addEventListener("change", renderTable);
      renderTable();
    },

    schedule(container) {
      App.setHeader("Availability Schedule", "Manage your working days and consultation time slots");
      const doctors = DB.get(KEYS.DOCTORS);
      const doc = doctors.find((d) => d.id === App.session.profileId);
      if (!doc) return;

      container.innerHTML = `
        <div class="card" style="max-width:760px;">
          <h3 style="margin-bottom:10px;">Available Days</h3>
          <div id="days-chips" class="slots-grid" style="margin-bottom:22px;">
            ${DAYS_OF_WEEK.map(
              (day) => `<button type="button" class="slot-chip ${doc.availableDays.includes(day) ? "selected" : ""}" data-day="${day}">${day}</button>`
            ).join("")}
          </div>

          <h3 style="margin-bottom:10px;">Consultation Time Slots</h3>
          <div id="slots-chips" class="slots-grid" style="margin-bottom:18px;">
            ${[...new Set([...DEFAULT_SLOTS, ...doc.availableSlots])]
              .map(
                (slot) => `<button type="button" class="slot-chip ${doc.availableSlots.includes(slot) ? "selected" : ""}" data-slot="${slot}">${slot}</button>`
              )
              .join("")}
          </div>

          <div class="form-row" style="align-items:flex-end; margin-bottom:18px;">
            <div class="form-group" style="margin-bottom:0;">
              <label for="custom-slot">Add Custom Time Slot</label>
              <input type="text" id="custom-slot" placeholder="e.g. 06:00 PM" />
            </div>
            <button type="button" class="btn btn-secondary" id="add-custom-slot-btn">+ Add Slot</button>
          </div>

          <button type="button" class="btn btn-primary" id="save-schedule-btn">Save Availability Schedule</button>
        </div>
      `;

      const bindChipToggle = (selector) => {
        container.querySelectorAll(selector).forEach((el) => {
          el.addEventListener("click", () => el.classList.toggle("selected"));
        });
      };
      bindChipToggle("#days-chips .slot-chip");
      bindChipToggle("#slots-chips .slot-chip");

      document.getElementById("add-custom-slot-btn").addEventListener("click", () => {
        const val = document.getElementById("custom-slot").value.trim().toUpperCase();
        if (!val) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot-chip selected";
        btn.dataset.slot = val;
        btn.textContent = val;
        btn.addEventListener("click", () => btn.classList.toggle("selected"));
        document.getElementById("slots-chips").appendChild(btn);
        document.getElementById("custom-slot").value = "";
      });

      document.getElementById("save-schedule-btn").addEventListener("click", () => {
        doc.availableDays = [...document.querySelectorAll("#days-chips .slot-chip.selected")].map((el) => el.dataset.day);
        doc.availableSlots = [...document.querySelectorAll("#slots-chips .slot-chip.selected")].map((el) => el.dataset.slot);
        DB.set(KEYS.DOCTORS, doctors);
        Toast.show("Availability schedule updated!", "success");
      });
    },

    reviews(container) {
      App.setHeader("My Ratings & Reviews", "Patient feedback and overall ranking");
      const did = App.session.profileId;
      const myReviews = DB.get(KEYS.REVIEWS).filter((r) => r.doctorId === did);
      const ranked = Utils.getRankedDoctors().find((d) => d.id === did);
      const patients = DB.get(KEYS.PATIENTS);

      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div><div class="stat-label">Average Rating</div><div class="stat-value">${ranked ? ranked.avgRating : 0} / 5</div></div><div class="stat-icon">&#11088;</div></div>
          <div class="stat-card"><div><div class="stat-label">Total Reviews</div><div class="stat-value">${myReviews.length}</div></div><div class="stat-icon">&#128172;</div></div>
          <div class="stat-card"><div><div class="stat-label">Hospital Rank</div><div class="stat-value">#${ranked ? ranked.rank : "-"}</div></div><div class="stat-icon">&#127942;</div></div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Patient Feedback</h3></div>
          ${
            !myReviews.length
              ? `<div class="empty-state">No reviews received yet.</div>`
              : myReviews
                  .map((r) => {
                    const pat = patients.find((p) => p.id === r.patientId);
                    return `
                      <div class="card" style="padding:14px; margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between;">
                          <strong>${pat ? Utils.escapeHtml(pat.name) : "Patient"}</strong>
                          <span>${Utils.renderStars(r.rating)}</span>
                        </div>
                        <p style="margin:6px 0; font-size:0.9rem;">${Utils.escapeHtml(r.comment)}</p>
                        <small class="muted-text">${r.date}</small>
                      </div>`;
                  })
                  .join("")
          }
        </div>
      `;
    },

    profile(container) {
      App.setHeader("Doctor Profile", "Manage your professional details and consultation fee");
      const doctors = DB.get(KEYS.DOCTORS);
      const doc = doctors.find((d) => d.id === App.session.profileId);
      if (!doc) return;

      container.innerHTML = `
        <div class="card" style="max-width:720px;">
          <form id="doc-profile-form">
            <div class="form-row">
              <div class="form-group"><label>Full Name</label><input type="text" id="dp-name" value="${Utils.escapeHtml(doc.name)}" required /></div>
              <div class="form-group"><label>Specialization</label><input type="text" id="dp-spec" value="${Utils.escapeHtml(doc.specialization)}" required /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Qualification</label><input type="text" id="dp-qual" value="${Utils.escapeHtml(doc.qualification)}" required /></div>
              <div class="form-group"><label>Phone</label><input type="tel" id="dp-phone" value="${Utils.escapeHtml(doc.phone)}" required /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Experience (Years)</label><input type="number" id="dp-exp" value="${doc.experience}" min="1" max="60" required /></div>
              <div class="form-group"><label>Consultation Fee (₹)</label><input type="number" id="dp-fee" value="${doc.fee}" min="100" required /></div>
            </div>
            <div class="form-group"><label>Bio</label><textarea id="dp-bio">${Utils.escapeHtml(doc.bio)}</textarea></div>
            <button type="submit" class="btn btn-primary">Save Profile</button>
          </form>
        </div>
      `;

      document.getElementById("doc-profile-form").addEventListener("submit", (e) => {
        e.preventDefault();
        doc.name = document.getElementById("dp-name").value.trim();
        doc.specialization = document.getElementById("dp-spec").value.trim();
        doc.qualification = document.getElementById("dp-qual").value.trim();
        doc.phone = document.getElementById("dp-phone").value.trim();
        doc.experience = Number(document.getElementById("dp-exp").value);
        doc.fee = Number(document.getElementById("dp-fee").value);
        doc.bio = document.getElementById("dp-bio").value.trim();
        DB.set(KEYS.DOCTORS, doctors);

        const users = DB.get(KEYS.USERS).map((u) => (u.id === App.session.id ? { ...u, name: doc.name } : u));
        DB.set(KEYS.USERS, users);
        App.session.name = doc.name;
        document.getElementById("sidebar-user-name").textContent = doc.name;
        Toast.show("Doctor profile saved!", "success");
      });
    }
  };

  /* ==========================================================================
     11. ADMIN VIEWS
     ========================================================================== */
  const AdminViews = {
    render(pageId, container) {
      switch (pageId) {
        case "dashboard": this.dashboard(container); break;
        case "manage-doctors": this.manageDoctors(container); break;
        case "manage-patients": this.managePatients(container); break;
        case "all-appointments": this.allAppointments(container); break;
        case "all-payments": this.allPayments(container); break;
        case "manage-refunds": this.manageRefunds(container); break;
        case "manage-tickets": this.manageTickets(container); break;
        case "analytics": this.analytics(container); break;
        default: this.dashboard(container);
      }
    },

    dashboard(container) {
      App.setHeader("Admin Dashboard", "Hospital-wide operations overview");
      const doctors = DB.get(KEYS.DOCTORS);
      const patients = DB.get(KEYS.PATIENTS);
      const appointments = DB.get(KEYS.APPOINTMENTS);
      const payments = DB.get(KEYS.PAYMENTS);
      const refunds = DB.get(KEYS.REFUNDS);
      const tickets = DB.get(KEYS.TICKETS);

      const revenue = payments.reduce((s, p) => s + Number(p.amount), 0);
      const pendingRefunds = refunds.filter((r) => r.status === "Pending").length;
      const openTickets = tickets.filter((t) => ["Open", "In Progress"].includes(t.status)).length;

      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div><div class="stat-label">Doctors</div><div class="stat-value">${doctors.length}</div></div><div class="stat-icon">&#129658;</div></div>
          <div class="stat-card"><div><div class="stat-label">Patients</div><div class="stat-value">${patients.length}</div></div><div class="stat-icon">&#128101;</div></div>
          <div class="stat-card"><div><div class="stat-label">Appointments</div><div class="stat-value">${appointments.length}</div></div><div class="stat-icon">&#128197;</div></div>
          <div class="stat-card"><div><div class="stat-label">Total Revenue</div><div class="stat-value">${Utils.formatCurrency(revenue)}</div></div><div class="stat-icon">&#128176;</div></div>
          <div class="stat-card"><div><div class="stat-label">Pending Refunds</div><div class="stat-value">${pendingRefunds}</div></div><div class="stat-icon">&#128184;</div></div>
          <div class="stat-card"><div><div class="stat-label">Open Tickets</div><div class="stat-value">${openTickets}</div></div><div class="stat-icon">&#127915;</div></div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Latest Appointments</h3>
            <button class="btn btn-secondary btn-sm" id="adm-reset-btn">Reset Sample Data</button>
          </div>
          <div class="table-responsive">
            <table>
              <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date &amp; Slot</th><th>Status</th><th>Payment</th></tr></thead>
              <tbody>
                ${appointments
                  .slice(0, 6)
                  .map((a) => {
                    const pat = patients.find((p) => p.id === a.patientId);
                    const doc = doctors.find((d) => d.id === a.doctorId);
                    return `
                      <tr>
                        <td><strong>${a.id}</strong></td>
                        <td>${pat ? Utils.escapeHtml(pat.name) : "Patient"}</td>
                        <td>${doc ? Utils.escapeHtml(doc.name) : "Doctor"}</td>
                        <td>${a.date} &bull; ${a.timeSlot}</td>
                        <td><span class="status-badge ${Utils.statusClass(a.status)}">${a.status}</span></td>
                        <td><span class="status-badge ${Utils.statusClass(a.paymentStatus)}">${a.paymentStatus}</span></td>
                      </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById("adm-reset-btn").addEventListener("click", () => {
        if (confirm("Reset all data to initial sample state?")) {
          DB.clearAll();
          seedDatabase(true);
          App.session = DB.get(KEYS.USERS).find((u) => u.role === "admin");
          DB.set(KEYS.SESSION, { userId: App.session.id, role: "admin" });
          Toast.show("Sample data reset!", "success");
          this.dashboard(container);
        }
      });
    },

    manageDoctors(container) {
      App.setHeader("Manage Doctors", "Add, edit, or remove hospital doctors");
      const ranked = Utils.getRankedDoctors();

      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3>Registered Doctors (${ranked.length})</h3>
            <button class="btn btn-primary btn-sm" id="add-doc-btn">+ Add Doctor</button>
          </div>
          <div class="table-responsive">
            <table>
              <thead><tr><th>Rank</th><th>Doctor</th><th>Specialization</th><th>Fee</th><th>Rating</th><th>Phone</th><th>Actions</th></tr></thead>
              <tbody>
                ${ranked
                  .map(
                    (d) => `
                  <tr>
                    <td><span class="rank-pill">#${d.rank}</span></td>
                    <td><strong>${Utils.escapeHtml(d.name)}</strong><div class="muted-text">${Utils.escapeHtml(d.email)}</div></td>
                    <td>${Utils.escapeHtml(d.specialization)}<div class="muted-text">${d.experience} yrs</div></td>
                    <td>${Utils.formatCurrency(d.fee)}</td>
                    <td>${Utils.renderStars(d.avgRating)} (${d.avgRating})</td>
                    <td>${Utils.escapeHtml(d.phone)}</td>
                    <td class="actions-cell">
                      <button class="btn btn-secondary btn-sm" data-edit-doc="${d.id}">Edit</button>
                      <button class="btn btn-danger-outline btn-sm" data-del-doc="${d.id}">Delete</button>
                    </td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById("add-doc-btn").addEventListener("click", () => this.openDoctorFormModal(null, container));
      container.querySelectorAll("[data-edit-doc]").forEach((btn) => {
        btn.addEventListener("click", () => this.openDoctorFormModal(btn.dataset.editDoc, container));
      });
      container.querySelectorAll("[data-del-doc]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!confirm("Remove this doctor from the system?")) return;
          const id = btn.dataset.delDoc;
          DB.set(KEYS.DOCTORS, DB.get(KEYS.DOCTORS).filter((d) => d.id !== id));
          DB.set(KEYS.USERS, DB.get(KEYS.USERS).filter((u) => u.id !== id));
          Toast.show("Doctor removed.", "warning");
          this.manageDoctors(container);
        });
      });
    },

    openDoctorFormModal(doctorId, container) {
      const doctors = DB.get(KEYS.DOCTORS);
      const doc = doctorId ? doctors.find((d) => d.id === doctorId) : null;

      Modal.open(
        doc ? `Edit Doctor — ${doc.name}` : "Add New Doctor",
        `
        <form id="adm-doc-form">
          <div class="form-row">
            <div class="form-group"><label>Full Name</label><input type="text" id="ad-name" value="${doc ? Utils.escapeHtml(doc.name) : ""}" placeholder="Dr. Full Name" required /></div>
            <div class="form-group"><label>Email</label><input type="email" id="ad-email" value="${doc ? Utils.escapeHtml(doc.email) : ""}" ${doc ? "disabled" : ""} required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Specialization</label><input type="text" id="ad-spec" value="${doc ? Utils.escapeHtml(doc.specialization) : "Cardiology"}" required /></div>
            <div class="form-group"><label>Qualification</label><input type="text" id="ad-qual" value="${doc ? Utils.escapeHtml(doc.qualification) : "MBBS, MD"}" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Phone</label><input type="tel" id="ad-phone" value="${doc ? Utils.escapeHtml(doc.phone) : ""}" placeholder="10-digit mobile" required /></div>
            <div class="form-group"><label>Experience (Yrs)</label><input type="number" id="ad-exp" value="${doc ? doc.experience : 5}" min="1" required /></div>
            <div class="form-group"><label>Fee (₹)</label><input type="number" id="ad-fee" value="${doc ? doc.fee : 700}" min="100" required /></div>
          </div>
          <div class="form-group"><label>Bio</label><textarea id="ad-bio">${doc ? Utils.escapeHtml(doc.bio) : "Experienced consultant at MedCare Hospital."}</textarea></div>
          <button type="submit" class="btn btn-primary btn-block">${doc ? "Update Doctor" : "Add Doctor"}</button>
        </form>
      `
      );

      document.getElementById("adm-doc-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("ad-name").value.trim();
        const email = document.getElementById("ad-email").value.trim().toLowerCase();
        const phone = document.getElementById("ad-phone").value.trim();

        if (!name || !Utils.validatePhone(phone)) {
          Toast.show("Please enter a valid name and 10-digit phone number.", "error");
          return;
        }

        if (doc) {
          doc.name = name;
          doc.specialization = document.getElementById("ad-spec").value.trim();
          doc.qualification = document.getElementById("ad-qual").value.trim();
          doc.phone = phone;
          doc.experience = Number(document.getElementById("ad-exp").value);
          doc.fee = Number(document.getElementById("ad-fee").value);
          doc.bio = document.getElementById("ad-bio").value.trim();
          DB.set(KEYS.DOCTORS, doctors);
          DB.set(KEYS.USERS, DB.get(KEYS.USERS).map((u) => (u.id === doc.id ? { ...u, name } : u)));
          Toast.show("Doctor updated!", "success");
        } else {
          const users = DB.get(KEYS.USERS);
          if (!Utils.validateEmail(email) || users.some((u) => u.email.toLowerCase() === email)) {
            Toast.show("Invalid or duplicate email address.", "error");
            return;
          }
          const id = Utils.uid("DOC");
          doctors.push({
            id,
            name: /^dr\./i.test(name) ? name : `Dr. ${name}`,
            email,
            phone,
            specialization: document.getElementById("ad-spec").value.trim(),
            qualification: document.getElementById("ad-qual").value.trim(),
            experience: Number(document.getElementById("ad-exp").value),
            fee: Number(document.getElementById("ad-fee").value),
            bio: document.getElementById("ad-bio").value.trim(),
            availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            availableSlots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
          });
          DB.set(KEYS.DOCTORS, doctors);
          users.push({ id, role: "doctor", name: /^dr\./i.test(name) ? name : `Dr. ${name}`, email, password: "password123", profileId: id });
          DB.set(KEYS.USERS, users);
          Toast.show("New doctor added (default password: password123).", "success");
        }
        Modal.close();
        this.manageDoctors(container);
      });
    },

    managePatients(container) {
      App.setHeader("Manage Patients", "View and manage registered patient records");
      const patients = DB.get(KEYS.PATIENTS);

      container.innerHTML = `
        <div class="card">
          <div class="filters-bar">
            <input type="text" id="adm-pat-search" placeholder="Search patient by name, email, or phone..." />
          </div>
          <div id="adm-pat-table"></div>
        </div>
      `;

      const renderTable = () => {
        const q = document.getElementById("adm-pat-search").value.trim().toLowerCase();
        const list = DB.get(KEYS.PATIENTS).filter(
          (p) => !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.phone.includes(q)
        );
        document.getElementById("adm-pat-table").innerHTML = `
          <div class="table-responsive">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Age / Gender</th><th>Blood</th><th>Address</th><th>Action</th></tr></thead>
              <tbody>
                ${list
                  .map(
                    (p) => `
                  <tr>
                    <td><strong>${p.id}</strong></td>
                    <td><strong>${Utils.escapeHtml(p.name)}</strong><div class="muted-text">${Utils.escapeHtml(p.email)}</div></td>
                    <td>${Utils.escapeHtml(p.phone)}</td>
                    <td>${p.age} / ${p.gender}</td>
                    <td><span class="status-badge status-in-progress">${p.bloodGroup}</span></td>
                    <td>${Utils.escapeHtml(p.address)}</td>
                    <td><button class="btn btn-danger-outline btn-sm" data-del-pat="${p.id}">Delete</button></td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;

        document.querySelectorAll("[data-del-pat]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (!confirm("Delete this patient record?")) return;
            const id = btn.dataset.delPat;
            DB.set(KEYS.PATIENTS, DB.get(KEYS.PATIENTS).filter((p) => p.id !== id));
            DB.set(KEYS.USERS, DB.get(KEYS.USERS).filter((u) => u.id !== id));
            Toast.show("Patient deleted.", "warning");
            renderTable();
          });
        });
      };

      document.getElementById("adm-pat-search").addEventListener("input", renderTable);
      renderTable();
    },

    allAppointments(container) {
      App.setHeader("All Appointments", "Monitor and filter all hospital bookings");
      const doctors = DB.get(KEYS.DOCTORS);
      const patients = DB.get(KEYS.PATIENTS);

      container.innerHTML = `
        <div class="card">
          <div class="filters-bar">
            <select id="adm-apt-status">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div id="adm-apt-table"></div>
        </div>
      `;

      const renderTable = () => {
        const st = document.getElementById("adm-apt-status").value;
        const list = DB.get(KEYS.APPOINTMENTS).filter((a) => !st || a.status === st);
        document.getElementById("adm-apt-table").innerHTML = !list.length
          ? `<div class="empty-state">No appointments found.</div>`
          : `
            <div class="table-responsive">
              <table>
                <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date &amp; Slot</th><th>Fee</th><th>Payment</th><th>Status</th></tr></thead>
                <tbody>
                  ${list
                    .map((a) => {
                      const pat = patients.find((p) => p.id === a.patientId);
                      const doc = doctors.find((d) => d.id === a.doctorId);
                      return `
                        <tr>
                          <td><strong>${a.id}</strong></td>
                          <td>${pat ? Utils.escapeHtml(pat.name) : a.patientId}</td>
                          <td>${doc ? Utils.escapeHtml(doc.name) : a.doctorId}</td>
                          <td>${a.date} &bull; ${a.timeSlot}</td>
                          <td>${Utils.formatCurrency(a.fee)}</td>
                          <td><span class="status-badge ${Utils.statusClass(a.paymentStatus)}">${a.paymentStatus}</span></td>
                          <td><span class="status-badge ${Utils.statusClass(a.status)}">${a.status}</span></td>
                        </tr>`;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>`;
      };

      document.getElementById("adm-apt-status").addEventListener("change", renderTable);
      renderTable();
    },

    allPayments(container) {
      App.setHeader("All Payments", "Review hospital revenue and payment transactions");
      const payments = DB.get(KEYS.PAYMENTS);
      const patients = DB.get(KEYS.PATIENTS);
      const doctors = DB.get(KEYS.DOCTORS);
      const total = payments.reduce((s, p) => s + Number(p.amount), 0);

      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3>Payment Transactions (${payments.length})</h3>
            <strong>Total Revenue: ${Utils.formatCurrency(total)}</strong>
          </div>
          <div class="table-responsive">
            <table>
              <thead><tr><th>Transaction ID</th><th>Appointment</th><th>Patient</th><th>Doctor</th><th>Method</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                ${payments
                  .map((p) => {
                    const pat = patients.find((x) => x.id === p.patientId);
                    const doc = doctors.find((x) => x.id === p.doctorId);
                    return `
                      <tr>
                        <td><strong>${p.transactionId}</strong></td>
                        <td>${p.appointmentId}</td>
                        <td>${pat ? Utils.escapeHtml(pat.name) : p.patientId}</td>
                        <td>${doc ? Utils.escapeHtml(doc.name) : p.doctorId}</td>
                        <td>${p.method}</td>
                        <td><strong>${Utils.formatCurrency(p.amount)}</strong></td>
                        <td>${p.date}</td>
                      </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    manageRefunds(container) {
      App.setHeader("Process Refund Requests", "Approve, reject, or complete patient refund requests");
      const refunds = DB.get(KEYS.REFUNDS);
      const patients = DB.get(KEYS.PATIENTS);

      container.innerHTML = `
        <div class="card">
          <div class="card-header"><h3>Refund Queue (${refunds.length})</h3></div>
          ${
            !refunds.length
              ? `<div class="empty-state">No refund requests in the queue.</div>`
              : `<div class="table-responsive">
                  <table>
                    <thead><tr><th>Refund ID</th><th>Patient</th><th>Appointment</th><th>Amount</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      ${refunds
                        .map((r) => {
                          const pat = patients.find((p) => p.id === r.patientId);
                          return `
                            <tr>
                              <td><strong>${r.id}</strong></td>
                              <td>${pat ? Utils.escapeHtml(pat.name) : r.patientId}</td>
                              <td>${r.appointmentId}</td>
                              <td><strong>${Utils.formatCurrency(r.amount)}</strong></td>
                              <td>${Utils.escapeHtml(r.reason)}</td>
                              <td><span class="status-badge ${Utils.statusClass(r.status)}">${r.status}</span></td>
                              <td class="actions-cell">
                                ${r.status === "Pending" ? `<button class="btn btn-success btn-sm" data-ref-act="Approved" data-ref-id="${r.id}">Approve</button><button class="btn btn-danger btn-sm" data-ref-act="Rejected" data-ref-id="${r.id}">Reject</button>` : ""}
                                ${r.status === "Approved" ? `<button class="btn btn-primary btn-sm" data-ref-act="Completed" data-ref-id="${r.id}">Mark Completed</button>` : ""}
                              </td>
                            </tr>`;
                        })
                        .join("")}
                    </tbody>
                  </table>
                </div>`
          }
        </div>
      `;

      container.querySelectorAll("[data-ref-act]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const all = DB.get(KEYS.REFUNDS);
          const ref = all.find((r) => r.id === btn.dataset.refId);
          if (!ref) return;

          const newStatus = btn.dataset.refAct;
          ref.status = newStatus;
          ref.adminNote = `Processed by Admin on ${Utils.todayISO()}`;
          DB.set(KEYS.REFUNDS, all);

          const pat = patients.find((p) => p.id === ref.patientId);
          Notifier.notify(ref.patientId, `Your refund request ${ref.id} (${Utils.formatCurrency(ref.amount)}) is now ${newStatus}.`);
          if (pat && (newStatus === "Approved" || newStatus === "Completed")) {
            Notifier.sendEmail(
              pat.email,
              `Refund ${newStatus} — ${ref.id}`,
              `Hello ${pat.name}, your refund request ${ref.id} for ${Utils.formatCurrency(ref.amount)} (Appointment ${ref.appointmentId}) has been marked as ${newStatus}.`
            );
          }

          Toast.show(`Refund ${ref.id} updated to ${newStatus}.`, "success");
          this.manageRefunds(container);
        });
      });
    },

    manageTickets(container) {
      App.setHeader("Manage Support Tickets", "Respond to user inquiries and update ticket statuses");
      const users = DB.get(KEYS.USERS);

      container.innerHTML = `
        <div class="card">
          <div class="filters-bar">
            <select id="adm-tkt-status">
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select id="adm-tkt-prio">
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div id="adm-tkt-table"></div>
        </div>
      `;

      const renderTable = () => {
        const st = document.getElementById("adm-tkt-status").value;
        const pr = document.getElementById("adm-tkt-prio").value;
        const list = DB.get(KEYS.TICKETS).filter((t) => (!st || t.status === st) && (!pr || t.priority === pr));

        document.getElementById("adm-tkt-table").innerHTML = !list.length
          ? `<div class="empty-state">No support tickets match these filters.</div>`
          : `
            <div class="table-responsive">
              <table>
                <thead><tr><th>ID</th><th>User</th><th>Category</th><th>Subject</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  ${list
                    .map((t) => {
                      const usr = users.find((u) => u.id === t.userId);
                      return `
                        <tr>
                          <td><strong>${t.id}</strong></td>
                          <td>${usr ? Utils.escapeHtml(usr.name) : t.userId}<div class="muted-text">${t.userRole}</div></td>
                          <td>${Utils.escapeHtml(t.category)}</td>
                          <td><strong>${Utils.escapeHtml(t.subject)}</strong><div class="muted-text">${Utils.escapeHtml(t.description)}</div></td>
                          <td><span class="status-badge ${Utils.statusClass(t.priority)}">${t.priority}</span></td>
                          <td><span class="status-badge ${Utils.statusClass(t.status)}">${t.status}</span></td>
                          <td><button class="btn btn-primary btn-sm" data-manage-tkt="${t.id}">Update</button></td>
                        </tr>`;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>`;

        document.querySelectorAll("[data-manage-tkt]").forEach((btn) => {
          btn.addEventListener("click", () => this.openTicketModal(btn.dataset.manageTkt, renderTable));
        });
      };

      document.getElementById("adm-tkt-status").addEventListener("change", renderTable);
      document.getElementById("adm-tkt-prio").addEventListener("change", renderTable);
      renderTable();
    },

    openTicketModal(ticketId, onDone) {
      const tickets = DB.get(KEYS.TICKETS);
      const tkt = tickets.find((t) => t.id === ticketId);
      if (!tkt) return;

      Modal.open(
        `Update Ticket — ${tkt.id}`,
        `
        <p style="margin-bottom:10px;"><strong>${Utils.escapeHtml(tkt.subject)}</strong></p>
        <p class="muted-text" style="margin-bottom:14px;">${Utils.escapeHtml(tkt.description)}</p>
        <form id="adm-tkt-form">
          <div class="form-group">
            <label for="at-status">Status</label>
            <select id="at-status">
              ${["Open", "In Progress", "Resolved", "Closed"].map((s) => `<option value="${s}" ${tkt.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="at-reply">Admin Reply</label>
            <textarea id="at-reply" placeholder="Enter response for the user..." required>${Utils.escapeHtml(tkt.adminReply)}</textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Save Update</button>
        </form>
      `
      );

      document.getElementById("adm-tkt-form").addEventListener("submit", (e) => {
        e.preventDefault();
        tkt.status = document.getElementById("at-status").value;
        tkt.adminReply = document.getElementById("at-reply").value.trim();
        tkt.updatedAt = Utils.todayISO();
        DB.set(KEYS.TICKETS, tickets);

        const usr = DB.get(KEYS.USERS).find((u) => u.id === tkt.userId);
        Notifier.notify(tkt.userId, `Support ticket ${tkt.id} updated to ${tkt.status}.`);
        if (usr) {
          Notifier.sendEmail(
            usr.email,
            `Support Ticket Updated — ${tkt.id}`,
            `Hello ${usr.name}, your ticket "${tkt.subject}" (${tkt.id}) is now ${tkt.status}. Admin Reply: ${tkt.adminReply}`
          );
        }

        Modal.close();
        Toast.show(`Ticket ${tkt.id} updated.`, "success");
        if (onDone) onDone();
      });
    },

    analytics(container) {
      App.setHeader("System Analytics", "Visual breakdown of appointments, revenue, and doctor rankings");
      const appointments = DB.get(KEYS.APPOINTMENTS);
      const payments = DB.get(KEYS.PAYMENTS);
      const doctors = Utils.getRankedDoctors();

      const statusCounts = ["Pending", "Approved", "Completed", "Cancelled", "Rejected"].map((st) => ({
        label: st,
        val: appointments.filter((a) => a.status === st).length
      }));
      const maxStatus = Math.max(1, ...statusCounts.map((s) => s.val));

      const methodTotals = ["UPI", "Credit Card", "Debit Card", "Net Banking"].map((m) => ({
        label: m,
        val: payments.filter((p) => p.method === m).reduce((s, p) => s + Number(p.amount), 0)
      }));
      const maxRev = Math.max(1, ...methodTotals.map((m) => m.val));

      const specCounts = [...new Set(doctors.map((d) => d.specialization))].map((sp) => {
        const docIds = doctors.filter((d) => d.specialization === sp).map((d) => d.id);
        return { label: sp, val: appointments.filter((a) => docIds.includes(a.doctorId)).length };
      });
      const maxSpec = Math.max(1, ...specCounts.map((s) => s.val));

      const renderBars = (items, max, isCurrency = false) =>
        `<div class="bar-chart">
          ${items
            .map(
              (item) => `
            <div class="bar-row">
              <div class="bar-row-label">
                <span>${Utils.escapeHtml(item.label)}</span>
                <span>${isCurrency ? Utils.formatCurrency(item.val) : item.val}</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.round((item.val / max) * 100)}%"></div></div>
            </div>`
            )
            .join("")}
        </div>`;

      container.innerHTML = `
        <div class="analytics-grid">
          <div class="card">
            <div class="card-header"><h3>Appointments by Status</h3></div>
            ${renderBars(statusCounts, maxStatus)}
          </div>
          <div class="card">
            <div class="card-header"><h3>Revenue by Payment Method</h3></div>
            ${renderBars(methodTotals, maxRev, true)}
          </div>
          <div class="card">
            <div class="card-header"><h3>Appointments by Specialization</h3></div>
            ${renderBars(specCounts, maxSpec)}
          </div>
          <div class="card">
            <div class="card-header"><h3>Doctor Ranking Leaderboard</h3></div>
            <div class="table-responsive">
              <table>
                <thead><tr><th>Rank</th><th>Doctor</th><th>Rating</th><th>Reviews</th></tr></thead>
                <tbody>
                  ${doctors
                    .map(
                      (d) => `
                    <tr>
                      <td><span class="rank-pill">#${d.rank}</span></td>
                      <td><strong>${Utils.escapeHtml(d.name)}</strong><div class="muted-text">${Utils.escapeHtml(d.specialization)}</div></td>
                      <td>${Utils.renderStars(d.avgRating)} ${d.avgRating}</td>
                      <td>${d.reviewCount}</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }
  };

  /* ==========================================================================
     12. BOOTSTRAP APPLICATION
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", () => App.init());
})();
