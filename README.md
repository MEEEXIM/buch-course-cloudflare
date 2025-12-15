# Курс «Бухгалтерия в Чехии» — инструкция по развёртыванию

## 1. Залейте файлы в GitHub
- Создайте репозиторий на GitHub (без README!)
- Закиньте все файлы из этой папки

## 2. В Cloudflare:
- Workers & Pages → Create application → Pages → Connect to Git
- Выберите репозиторий
- Build command: оставьте пустым
- Build output directory: `.`

## 3. Создайте KV-хранилища:
- Workers & Pages → Settings → Functions
- KV Namespace Bindings → Add binding:
  - Variable name: `ACCOUNTS`, Namespace: `accounts`
  - Variable name: `CODES`, Namespace: `access_codes`

## 4. Добавьте тестовый код:
- Workers → KV → выберите `access_codes`
- Add key:
  - Key: `TEST123`
  - Value: `1736496000000` (это 10 января 2025, 00:00 UTC)

Готово!