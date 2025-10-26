# J DOC EMR: Healing Hands, Connected Care

[![LemmaIoT Cloud Solution](https://img.shields.io/badge/Developed%20by-LemmaIoT%20Cloud%20Solution-3b82f6?style=for-the-badge&logo=icloud)](https://lemmaiot.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

**J DOC (Jesuwosan Digital Outreach Clinic)** is more than an application; it's a mission in digital form. This robust, offline-first Electronic Medical Records (EMR) system is engineered to bring world-class healthcare management to the most challenging environments, ensuring seamless operation even in low-connectivity areas.

---

### A Project with a Higher Calling

> "Heal the sick who are there and tell them, ‘The kingdom of God has come near to you.’" - Luke 10:9

This project was built on a foundation of faith. We believe that technology, when guided by purpose, can be a powerful instrument for compassion and service. J DOC EMR is our answer to the call to serve the underserved, to empower medical professionals on the front lines, and to extend a ministry of healing to those in need. It is an expression of our belief that every line of code can contribute to a story of hope and restoration, reflecting the ultimate healing offered through the Gospel.

---

## Vision & Purpose

In many parts of the world, medical missions and remote clinics face a critical challenge: unreliable internet access. This digital divide hinders their ability to maintain accurate, accessible patient records, impacting the quality of care.

**J DOC EMR solves this problem.** By leveraging a powerful local-first architecture with Dexie.js (IndexedDB), the application functions perfectly offline. All data—from patient registration to clinical notes and prescriptions—is securely stored on the device. When a connection becomes available, it intelligently and automatically syncs all changes with a central Firebase cloud database, ensuring data integrity and accessibility for the entire team.

## Key Features

-   **Offline-First Architecture**: Read, create, update, and delete records with zero internet dependency. Never lose work due to a dropped connection.
-   **Intelligent Cloud Sync**: Automatic, real-time, bi-directional synchronization with Firestore when online.
-   **Role-Based Access Control (RBAC)**: Granular permissions for Admins, Doctors, Nurses, Pharmacists, and more, ensuring data security and proper workflow.
-   **Comprehensive Patient Management**: Detailed patient profiles, status tracking, department assignments, and a scannable QR/barcode ID system.
-   **Modular Clinical Dashboards**: Dedicated workspaces for various departments including General Consultation, Pharmacy, Surgery, Dental, Laboratory, Physiotherapy, and more.
-   **End-to-End Clinical Workflow**:
    -   Patient Vitals & Health Summary
    -   Clinical Notes & Diagnosis History
    -   Pharmacy Queue with Prescription Status
    -   Surgical Schedule with Digital Consent Forms
-   **Robust Auditing**: Every critical action is logged, providing a transparent and secure record of user activity.
-   **Real-time Push Notifications**: Pharmacists and surgeons are instantly notified of new prescriptions and schedule changes.

## Tech Stack

This application is built with modern, reliable, and scalable technologies:

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **Local Database**: Dexie.js (a powerful wrapper for IndexedDB)
-   **Backend & Sync**: Firebase (Firestore, Firebase Auth, Cloud Messaging)
-   **Routing**: React Router
-   **State Management**: React Context API & `dexie-react-hooks`

## Developed with Purpose by LemmaIoT Cloud Solution

**J DOC EMR** is proudly developed and maintained by **LemmaIoT Cloud Solution**.

At LemmaIoT, we are more than just software engineers; we are architects of solutions that serve humanity. Our mission is to harness the power of the cloud and modern technology to solve real-world problems, driven by a commitment to excellence and a heart for service. This project is a testament to our dedication to creating technology that makes a tangible, positive impact on lives.

## Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/j-doc-emr.git
    cd j-doc-emr
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    -   Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    -   Enable Firestore, Authentication (Email/Password), and Cloud Messaging.
    -   Get your Firebase project configuration and VAPID key.
    -   Update the `firebaseConfig` object in `./pages/patients/firebase.ts`.
    -   Place the `firebase-messaging-sw.js` file in your `public` directory.

4.  **Run the application:**
    ```bash
    npm run dev
    ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
