# BTime
All-in-one private cloud &amp; media center built with Angular, ASP.NET Core, and PostgreSQL. Features virtual filesystem management, media gallery, and Netflix-style MP4 streaming with role-based access control.

# Personal Cloud & Media Center

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)
![.NET Core](https://img.shields.io/badge/.NET_8.0-512BD4?style=flat&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

Una piattaforma self-hosted modulare e sicura per la gestione di file, librerie fotografiche e streaming multimediale personale. Il progetto è progettato per essere eseguito 24/7 su hardware casalingo a basso consumo (Mini PC / Home Server).

---

## 🚀 Caratteristiche Principali

- **Autenticazione & Profilazione (RBAC):** Sistema di login con JWT e Refresh Token. Dashboard dinamica che mostra unicamente le sezioni e le funzionalità abilitate per il ruolo dell'utente.
- **Modulo Cloud (Virtual FileSystem):** 
  - Gestione file e cartelle astratta via Database (spostamenti e rinomina istantanei).
  - Upload a blocchi (chunked upload) per file di grandi dimensioni.
  - Anteprima integrata per immagini, documenti di testo e file PDF.
- **Modulo Foto & Video Personali:** 
  - Estrattore automatico di metadati EXIF.
  - Generazione di miniature WebP in background per un caricamento ultra-veloce della galleria.
- **Modulo Film ("Stile Netflix"):**
  - Catalogo multimediale con ricerca, categorie, tag e metadati.
  - Streaming video MP4 nativo con supporto a **HTTP Range Requests** (`206 Partial Content`).
  - Elaborazione asincrona via FFmpeg per la generazione di risoluzioni multiple.

---

## 🛠️ Stack Tecnologico

### Frontend
- **Framework:** Angular 17+ (TypeScript)
- **Styling:** Tailwind CSS
- **Media Player:** Video.js / HTML5 Player avanzato

### Backend
- **Framework:** ASP.NET Core Web API (.NET 8)
- **ORM:** Entity Framework Core
- **Database:** PostgreSQL
- **Background Jobs:** Hosted Services / Hangfire & FFmpeg

### Infrastructure & Deployment
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx / Certbot (HTTPS)
- **Target Hardware:** Linux / Ubuntu Server (Dell OptiPlex 3050 Micro o simili)

---

## 📐 Architettura dello Storage

Per garantire massima scalabilità, integrità dei dati e prestazioni elevate, il sistema adotta un approccio **Virtual FileSystem**:
- **Fisico:** I file vengono salvati sul disco fisso in percorsi isolati (`/storage/users/{user_id}/files/`) associati a GUID univoci.
- **Logico:** L'albero di cartelle, i nomi originali, i permessi e la gerarchia sono completamente gestiti via database PostgreSQL.

---

## 🚦 Roadmap del Progetto

- [x] **Fase 1:** Definizione Architettura, Licenza e Setup Ambiente
- [ ] **Fase 2:** Autenticazione JWT, Gestione Ruoli e Dashboard Angular
- [ ] **Fase 3:** Modulo Cloud (Virtual FileSystem & Chunked Upload)
- [ ] **Fase 4:** Modulo Media (Galleria Foto con Thumbnails e Streaming Film MP4)
- [ ] **Fase 5:** Containerizzazione Docker Compose e Deploy su Home Server

---

## 🔧 Configurazione e Avvio Locale (Development)

### Prerequisiti
- [Node.js](https://nodejs.org/) (v18+) & Angular CLI
- [.NET 8 SDK](https://dotnet.microsoft.com/)
- [Docker Desktop](https://www.docker.com/)

### 1. Clona il repository
```bash
git clone [https://github.com/tuo-username/nome-repo.git](https://github.com/tuo-username/nome-repo.git)
cd nome-repo
