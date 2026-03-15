#!/bin/bash
cd "$(dirname "$0")/backend"
npm install --silent
node server.js
