#!/bin/bash
cd /tmp/kavia/workspace/code-generation/personal-notes-manager-5355fbcb/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

