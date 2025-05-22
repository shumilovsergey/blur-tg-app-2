# Dockerfile
FROM python:3.10-slim

# install FastAPI + Uvicorn
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy everything tracked by Docker (your index.html, style.css, app.js, main.py, etc.)
COPY . .

# expose port 80
EXPOSE 80

# run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
