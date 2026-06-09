# intent-filtering

Single Page App experimenting NLP-based intent filtering on IMDB

The goal of this project is to replace traditional filters (checkbox, dropdowns, ...) by a text area where the user defines its filters in natural language, in order to ease User experience.

# Stages of the projects

This project will follow 4 stages :
  **STAGE 0 - Prerequisites**: build infrastructure, make documentation (README.md), make the project AI-ready (AGENTS.md, TESTING.md)
  **STAGE 1 - Backend**: build the backend (IMDB data, SQLITE, Python/FastAPI, endpoints accepting filters as structured objects)
  **STAGE 2 - Frontend**: build the frontend (React/Next.js, Tailwind.css, a dashboard with traditional filters and some dataviz, requests to backend with filters sent as structured objects)
  **STAGE 3 - Intent filtering**: add intent filtering in the frontend, explore ways to transform natural langage intent filtering into structured objects
  **STAGE 4 - Scaling**: add many filters to evaluate scalability of the approach

The current stage is the STAGE 0 - Prerequisites

# Repository's structure

Here is how the repository is structured :
  . the `./api` directory stores the backend
  . the `./frontend` directory stores the frontend SPA
  
# Quick start

You should launch both the backend API and the frontend server, both running on localhost :
```TODO: bash commands to launch both the backend API and the frontend server```
