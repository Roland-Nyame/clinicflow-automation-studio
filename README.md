# ClinicFlow — White-Labeled Multi-Tenant Workflow Studio

A full-stack Next.js white-labeled automation studio that mimics the complete **n8n** workflow editor, execution inspector, credentials vault, and live agent tester — strictly isolated per dental clinic (**Prodent**, **Omabod**, **BusyBite**, **Reign Dental**, etc.) with **zero exposure** that `n8n` is running under the hood.

---

## Pre-Configured Dental Clinic Logins

| Dental Clinic | Login Email | Password | Isolated Workflows Included |
| :--- | :--- | :--- | :--- |
| **Prodent Dental Clinic** | `prodent@prodentdental.com` | `prodent123` | Prodent WhatsApp AI Agent, Facebook Agent, Instagram Agent, 24h Reminder Agent |
| **Omabod Dental Clinic** | `omabod@omaboddental.com` | `omabod123` | Omabod WhatsApp AI Agent, Facebook Agent, Instagram Agent, 24h Reminder Agent |
| **BusyBite Dental Studio** | `busybite@busybitedental.com` | `busybite123` | BusyBite WhatsApp AI Agent, Facebook Agent, Instagram Agent, 24h Reminder Agent |
| **Reign Dental Clinic** | `reign@reigndental.com` | `reign123` | Reign Dental WhatsApp AI Agent, Facebook Agent, Instagram Agent, 24h Reminder Agent |
| **Agency Super Admin** | `admin@clinicflow.io` | `admin123` | **All Clinics** + Onboard New Clinics + Connect Live n8n API |

---

## Adding More Dental Clinics

1. Log in as **Super Admin** (`admin@clinicflow.io` / `admin123`) and click **Live Engine & Clinics** in the left sidebar.
2. Open the **Clinics** tab and create any new dental clinic — it automatically provisions a dedicated login (`<slug>@<slug>dental.com` / `<slug>123`) and its own isolated WhatsApp, Facebook, Instagram, and Reminder AI Agent workflows, or syncs live workflows tagged `clinic:<slug>` from your n8n instance.
