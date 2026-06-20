// Minimal dependency-free PDF generator for simple text documents (e.g. credit
// notes to attach to emails). Produces a single A4 page of left-aligned text.

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export const A4_HEIGHT = 842;
export const A4_WIDTH = 595;

type TextOpts = { size?: number; bold?: boolean; align?: "left" | "right" | "center" };

// A small absolutely-positioned PDF builder (text + lines) for richer layouts
// like full invoices. Coordinates use PDF space (origin bottom-left); use
// `fromTop` to position from the top of the page.
export class PdfDoc {
  private ops: string[] = [];

  fromTop(t: number): number {
    return A4_HEIGHT - t;
  }

  private approxWidth(str: string, size: number): number {
    return str.length * size * 0.5;
  }

  text(x: number, y: number, str: string, opts: TextOpts = {}): void {
    const size = opts.size ?? 10;
    const font = opts.bold ? "F2" : "F1";
    let tx = x;
    if (opts.align === "right") tx = x - this.approxWidth(str, size);
    else if (opts.align === "center") tx = x - this.approxWidth(str, size) / 2;
    this.ops.push(
      `BT /${font} ${size} Tf ${tx.toFixed(2)} ${y.toFixed(2)} Td (${escapeText(str)}) Tj ET`,
    );
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 0.5): void {
    this.ops.push(
      `${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
    );
  }

  render(): Buffer {
    const stream = this.ops.join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ];
    return assemble(objects);
  }
}

// Assembles numbered PDF objects with a cross-reference table.
function assemble(objects: string[]): Buffer {
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

export function simplePdf(title: string, lines: string[]): Buffer {
  const parts: string[] = [];
  parts.push(`BT /F1 16 Tf 50 800 Td (${escapeText(title)}) Tj ET`);
  let y = 770;
  for (const line of lines) {
    parts.push(`BT /F1 11 Tf 50 ${y} Td (${escapeText(line)}) Tj ET`);
    y -= 18;
  }
  const stream = parts.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  return assemble(objects);
}

