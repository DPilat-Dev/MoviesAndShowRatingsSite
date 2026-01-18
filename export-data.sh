#!/bin/bash

# Script to export Bosnia Movie Rankings data as JSON
# Usage: ./export-data.sh [output-file]

OUTPUT_FILE="${1:-bosnia-movie-rankings-export-$(date +%Y-%m-%d).json}"

echo "Exporting Bosnia Movie Rankings data to $OUTPUT_FILE..."

# Export all data using the API
curl -s "http://localhost:5000/api/data/export?includeUsers=true&includeMovies=true&includeRankings=true" \
  -H "Accept: application/json" \
  -o "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Data exported successfully to $OUTPUT_FILE"
  echo "📊 File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
  echo "📋 Sample of exported data:"
  head -5 "$OUTPUT_FILE"
  echo "..."
else
  echo "❌ Failed to export data"
  exit 1
fi