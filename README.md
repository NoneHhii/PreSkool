# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

# 🎓 School Management System

A modern and responsive **School Management System** built with React, TypeScript and Vite.

The system is designed to help schools manage students, teachers, classes, attendance, examinations and other academic information through a centralized web application.

---

## 📌 Overview

The School Management System provides a centralized platform for managing academic and administrative activities.

### Main objectives

- Manage student information
- Manage teachers
- Manage classes and subjects
- Track student attendance
- Manage examinations and results
- Provide an overview through a dashboard
- Provide role-based access control
- Provide a responsive interface for desktop, tablet and mobile devices

---

## 🚀 Features

### 🔐 Authentication

- Login
- Logout
- Forgot password
- Reset password
- Protected routes
- Authentication state management

### 📊 Dashboard

The dashboard provides an overview of the school's current status.

- Total students
- Total teachers
- Total classes
- Attendance statistics
- Academic performance
- Recent activities
- Charts and statistics

### 👨‍🎓 Student Management

- View student list
- Search students
- Filter students
- View student details
- Add new student
- Edit student information
- Delete student
- Manage student status
- View academic information

### 👨‍🏫 Teacher Management

- View teacher list
- Search teachers
- Add teacher
- Edit teacher
- Delete teacher
- View teacher information

### 🏫 Class Management

- View classes
- Create class
- Edit class
- Delete class
- View students in a class
- Assign teachers
- Manage subjects

### 📚 Subject Management

- View subjects
- Create subject
- Edit subject
- Delete subject
- Assign subjects to classes

### 📝 Attendance

- Record attendance
- View attendance history
- Filter attendance by date
- Filter by class
- View attendance statistics

### 📋 Examination & Results

- Create examinations
- Manage exam schedules
- Enter student scores
- View results
- Calculate grades
- View academic performance

### ⚙️ Settings

- Account settings
- Profile settings
- System settings
- Theme settings

---

# 🏗️ Architecture

The project follows a **feature-based architecture** combined with separation between UI, business logic and API communication.

```text
src/
│
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types.ts
│   │
│   ├── students/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types.ts
│   │
│   ├── teachers/
│   ├── classes/
│   ├── subjects/
│   ├── attendance/
│   ├── exams/
│   └── assignments/
│
├── components/
│   ├── ui/
│   └── layout/
│
├── hooks/
│
├── stores/
│
├── types/
│
├── utils/
│
├── lib/
│   ├── axios.ts
│   └── queryClient.ts
│
├── assets/
│
├── styles/
│
├── main.tsx
└── App.tsx

