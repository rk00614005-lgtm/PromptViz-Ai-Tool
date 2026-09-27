/**
 * Utilities for exporting charts, CSV tables, and reports
 */

export function exportDataToCsv(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);

  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const val = row[header];
          const escaped = String(val ?? '').replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.[^/.]+$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportChartToPng(containerElementId: string, filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const container = document.getElementById(containerElementId);
      if (!container) {
        console.error('Container element not found for PNG export:', containerElementId);
        resolve(false);
        return;
      }

      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        console.error('No SVG found inside container:', containerElementId);
        resolve(false);
        return;
      }

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgElement.clientWidth * 2 || 1200;
        canvas.height = svgElement.clientHeight * 2 || 800;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a'; // clean navy background
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `${filename}.png`;
          downloadLink.href = pngUrl;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      image.src = blobURL;
    } catch (err) {
      console.error('PNG export failed:', err);
      resolve(false);
    }
  });
}
