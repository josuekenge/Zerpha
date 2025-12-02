import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InfographicPage } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDomain(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return '—';
  }
  return url
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/$/, '')
    .trim() || '—';
}

export function downloadInfographicPdf(data: InfographicPage) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return;
  }

  const documentHtml = `
    <html>
      <head>
        <title>${data.title}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 32px; color: #0f172a; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          h2 { font-size: 18px; margin-top: 24px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
          .metric { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
          .muted { color: #64748b; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <p class="muted">${data.subtitle}</p>
        <h2>Key Metrics</h2>
        <div class="metrics">
          ${data.key_metrics
            .map(
              (metric) =>
                `<div class="metric"><div class="muted">${metric.label}</div><strong>${metric.value}</strong></div>`,
            )
            .join('')}
        </div>
        <h2>Strategic Analysis</h2>
        <ul>
          ${data.bullets.map((b) => `<li>${b}</li>`).join('')}
        </ul>
      </body>
    </html>
  `;

  printWindow.document.write(documentHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
