# Build the existing React app; no credentials enter either build stage.
FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM python:3.12-slim-bookworm AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && useradd --uid 10001 --create-home appuser
COPY hosting ./hosting
COPY agents/homework-coach-agent/homework_core.py ./agents/homework-coach-agent/homework_core.py
COPY agents/homework-coach-agent/narrator.py ./agents/homework-coach-agent/narrator.py
COPY --from=frontend /build/dist ./dist
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8080')+'/agent-api/health', timeout=2)"
CMD ["sh", "-c", "exec uvicorn hosting.app:app --host 0.0.0.0 --port ${PORT:-8080}"]
