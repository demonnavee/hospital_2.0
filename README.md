# MedCare — Hospital Appointment Booking System

A complete, frontend-only Hospital Appointment Booking System built purely with **HTML, CSS, Vanilla ES6 JavaScript, and LocalStorage** — zero external libraries or backend required.

## Project Files

1. `index.html` — Semantic application shell, authentication forms, modals, and responsive layout.
2. `style.css` — Healthcare blue/white theme, Dark Mode support, animations, responsive sidebar, cards, tables, and charts.
3. `script.js` — Modular ES6 JavaScript powering LocalStorage persistence, authentication, role-based dashboards, booking validation, payments, refunds, reviews, support tickets, live chat, FAQs, and notifications.
4. `README.md` — Setup instructions, demo credentials, and feature overview.

## How to Run

1. Unzip `hospital-appointment-system.zip`.
2. Double-click `index.html` to open it in any modern web browser (Chrome, Edge, Firefox, Safari).
3. Use the **Quick Demo Login** buttons on the left panel or sign in manually using the credentials below.

## Demo Login Credentials

All sample accounts use the password: `password123`

| Role | Email | Password |
| :--- | :--- | :--- |
| **Patient** | `aarav.sharma@example.com` | `password123` |
| **Doctor** | `ananya.rao@medcare.in` | `password123` |
| **Admin** | `admin@medcare.in` | `password123` |

*(5 sample doctors and 10 sample patients are pre-loaded in LocalStorage. Click **Reset Sample Data** on the login screen or Admin Dashboard to restore the initial dataset anytime.)*

## Implemented Features

- **Authentication & Sessions**: Role-based login (Patient, Doctor, Admin), Patient/Doctor registration with validation, LocalStorage session management, and logout.
- **Patient Portal**: Profile editing, doctor search/filter/ranking, doctor details modal, slot booking with duplicate-booking prevention, appointment history & cancellation, payment simulation (UPI, Debit Card, Credit Card, Net Banking with auto-generated Transaction IDs), refund requests, 1–5 star ratings & reviews.
- **Doctor Portal**: Profile management, accept/reject/complete appointments, interactive availability schedule manager (working days & custom time slots), ratings & reviews dashboard.
- **Admin Portal**: Statistics dashboard, add/edit/delete doctors, manage patients, view all appointments & payments, process refund requests (Approve / Reject / Completed), manage support tickets with replies, and pure-CSS System Analytics.
- **Customer Support**: Ticket raising (6 categories, 3 priorities, 4 statuses), ticket history, Admin ticket management, interactive Live Chat Support simulation, and FAQ accordion.
- **Notifications**: Real-time Toast alerts, Notification Center with unread badge, and Simulated Email Log (for bookings, approvals, cancellations, payments, refunds, and ticket updates).
- **UI & Accessibility**: Responsive mobile-friendly sidebar, Light/Dark mode toggle persisted in LocalStorage, smooth animations.
