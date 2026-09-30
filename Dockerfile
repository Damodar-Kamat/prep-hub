# Interview OS — container image (used by Render; works on any Docker host)
FROM python:3.12-slim

# JDK / g++ / Node power the Code lab runner; git syncs your data with the private data repo
RUN apt-get update \
 && apt-get install -y --no-install-recommends default-jdk-headless g++ nodejs git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
ENV PYTHONUNBUFFERED=1
EXPOSE 8777
# Render injects $PORT
CMD ["sh", "-c", "exec python3 server.py --host 0.0.0.0 --port ${PORT:-8777} --no-browser"]
