# Recipes

This project is a Spring Boot/Kotlin backend with a React/Vite frontend. It is
intended to run locally; no cloud deployment or IDE is required.

## Prerequisites

Install the following and make sure they are available on `PATH`:

- Java 17 JDK (and `JAVA_HOME`, if Java is not already on `PATH`)
- Node.js 20.19+ or 22.12+ (npm is included)

The Gradle wrapper and `package-lock.json` are committed, so Gradle and the
frontend packages do not need to be installed globally.

## Quick start on Windows

From the repository directory (`C:\UTV\recipes`), either double-click
`run-local.bat` or run this in PowerShell:

```powershell
.\run-local.ps1
```

The launcher installs frontend dependencies the first time, then opens two
PowerShell windows:

- Frontend: http://localhost:5173/
- Backend: http://localhost:8080/

Close both child PowerShell windows to stop the application. If dependencies
are already installed, skip the install check with:

```powershell
.\run-local.ps1 -SkipInstall
```

## Manual command-line start

Use two terminals if you prefer not to use the launcher.

Terminal 1 (backend):

```powershell
Set-Location C:\UTV\recipes
.\gradlew.bat bootRun
```

Terminal 2 (frontend):

```powershell
Set-Location C:\UTV\recipes\recipe-frontend
npm ci
npm run dev
```

Run the backend from the repository directory because the local H2 database
path is relative to that directory.

## Build and test

```powershell
Set-Location C:\UTV\recipes
.\gradlew.bat test
.\gradlew.bat build

Set-Location .\recipe-frontend
npm run lint
npm run build
```

The backend executable JAR is written to `build\libs`. The frontend production
files are written to `recipe-frontend\dist`. The development launcher is the
recommended local workflow because the frontend and backend are currently
separate applications.

## Local H2 database

The application uses a file-based H2 database at `data\recipesdb.mv.db` and
updates its schema on startup. The H2 console is available at:

http://localhost:8080/h2-console

Use these H2 console connection values:

```text
JDBC URL: jdbc:h2:file:./data/recipesdb
User: sa
Password: password
```

The frontend and backend URLs are configured in
`src/main/resources/application.properties` and
`recipe-frontend/src/config.tsx`; keep them in sync if you change ports.

## Recipe pictures from `data/media`

You can link one picture file to each recipe by filename.

- Store files in `data\media` (for example `data\media\lasagna.jpg`)
- In recipe edit mode, fill **Picture file name (from data/media)** with
  `lasagna.jpg`
- The recipe form also provides a dropdown populated from existing image files
  in `data/media`
- Printable view loads the image from `/api/recipes/media/<fileName>` and
  constrains size so the recipe card width does not expand

The recipe import/export format now includes the optional
`ImageFileName` field on `Recipe` lines:

```text
Recipe	Name	IsSubrecipe	People	...	Categories	ImageFileName
```

