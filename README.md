# Traffic Scanner — Нейросетевой анализ трафика в реальном времени

Проект позволяет в реальном времени анализировать видеопоток с камер/трансляций (YouTube Live, VK, публичные HLS-камеры и т.д.), детектировать транспортные средства (легковые автомобили, мотоциклы, автобусы, грузовики) с помощью YOLOv8, присваивать им уникальные ID и считать статистику движения.

Проект состоит из двух частей:
- **Backend** — Python + Flask + YOLOv8 + ffmpeg (запуск в Google Colab)
- **Frontend** — React (TypeScript + Tailwind + Framer Motion) в стиле Cyberpunk 2077

## Возможности

- Обнаружение и трекинг транспорта в живом потоке
- Подсчёт въехавших/выехавших машин по типам (car, motorcycle, bus, truck)
- Статистика направления движения (влево/вправо)
- Примерная средняя скорость (в пикселях/кадр)
- Красивый интерфейс в стиле Cyberpunk 2077 с неоновыми элементами и glitch-эффектами
- Поддержка любых источников: YouTube Live, VK видео, публичные HLS/RTSP-камеры
- Динамическая смена потока без перезапуска сервера

## Технологии

**Backend**
- Python 3.10+
- Flask + flask-cors
- Ultralytics YOLOv8 (yolov8n.pt)
- OpenCV + ffmpeg (для чтения и обработки потоков)
- yt-dlp (извлечение HLS из YouTube/VK и др.)
- Cloudflare Tunnel / Localtunnel / ngrok (для публичного доступа из Colab)

**Frontend**
- React + TypeScript
- Tailwind CSS
- Framer Motion (анимации)
- Lucide Icons
- Стиль Cyberpunk 2077 (неон, glitch, CRT-эффекты)

## Установка и запуск

### 1. Backend (Google Colab)

1. Открой [Google Colab](https://colab.research.google.com/)
2. Создай новый ноутбук
3. Подключи GPU: Runtime → Change runtime type → T4 GPU
4. Скопируй и запусти весь код из файла `backend.ipynb` (или из сообщения с финальной версией)
5. Дождись вывода публичного URL (trycloudflare.com / loca.lt / pinggy)
6. Скопируй URL (например `https://xxx.trycloudflare.com`)

**Важно**: Каждый запуск Colab даёт новый URL. Для стабильности используй Cloudflare Tunnel с аккаунтом.

### 2. Frontend

1. Склонируй репозиторий (или создай новый Vite-проект)
2. Установи зависимости:

```bash
npm install
# или
yarn install
