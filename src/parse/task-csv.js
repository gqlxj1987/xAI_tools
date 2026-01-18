import { parse } from 'csv-parse/sync';
import { fromCsv } from '../io/csv.js';

const CSV_HEADER = 'username,tweet_id,created_at,text,original_url';

export function extractCsvFromMessage(message) {
  if (!message) {
    return null;
  }
  const fenceMatch = message.match(/```csv\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  const headerIndex = message.indexOf(CSV_HEADER);
  if (headerIndex >= 0) {
    return message.slice(headerIndex).trim();
  }
  return null;
}

export function parseCsvFromMessage(message) {
  const csv = extractCsvFromMessage(message);
  if (!csv) {
    return [];
  }
  try {
    return fromCsv(csv);
  } catch (err) {
    const records = parse(csv, { columns: true, skip_empty_lines: true, relax_column_count: true });
    return records.filter((row) => row.username && row.tweet_id && row.original_url);
  }
}
