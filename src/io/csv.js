import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

const HEADERS = ['username', 'tweet_id', 'created_at', 'text', 'original_url'];

export function toCsv(rows) {
  return stringify(rows, { header: true, columns: HEADERS });
}

export function fromCsv(content) {
  return parse(content, { columns: true, skip_empty_lines: true });
}
