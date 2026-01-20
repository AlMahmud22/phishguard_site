#!/bin/bash
set -e

git pull origin main
npm install
npm run build
pm2 restart phishguard
pm2 status
