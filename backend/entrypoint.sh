#!/bin/sh
# Fix ownership of alembic directories for the current user
if [ -d /app/alembic/versions ]; then
    chmod 750 /app/alembic/versions
fi

# Run the original command
exec "$@"
