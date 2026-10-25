# Etapa 1 (builder): instala dependencias. Lo que hay aquí NO llega a la imagen final.
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Etapa 2 (final): imagen mínima, solo lo necesario para correr.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# Usuario sin privilegios: si alguien compromete el proceso, no es root.
RUN useradd --create-home --uid 10001 appuser
WORKDIR /app
COPY --from=builder /install /usr/local
# Solo el código que corre. generate_key.py NO entra a la imagen.
COPY main.py pqc.py ./

USER appuser
EXPOSE 8001

# Docker revisa cada 30 s que el servicio responda.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
