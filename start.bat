@echo off
cd %~dp0backend
npm install --silent
node server.js
pause
