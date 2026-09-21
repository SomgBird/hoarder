import { escapeHtml } from '../../utils/escapeHtml'

export function gameFieldsHtml(item) {
  return `
    <tr><td>Platform</td><td>${escapeHtml(item.attributes?.platform || '—')}</td></tr>
    <tr><td>Status</td><td>${escapeHtml(item.status)}</td></tr>
  `
}