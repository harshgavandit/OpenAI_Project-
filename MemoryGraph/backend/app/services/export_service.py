# Updated by GitHub contribution automation.
"""Export service for memories."""
import io
import json
from datetime import datetime
from typing import Literal

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
    from reportlab.lib import colors
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


class ExportService:
    """Export memories in various formats."""

    @staticmethod
    def export_json(memories: list) -> io.StringIO:
        """Export memories as JSON."""
        data = {
            "exported_at": datetime.utcnow().isoformat(),
            "memories": [
                {
                    "id": m.id,
                    "title": m.title,
                    "summary": m.summary,
                    "raw_text": m.raw_text,
                    "structured_data": m.structured_data,
                    "metadata": m.metadata_json,
                    "created_at": m.created_at.isoformat(),
                    "updated_at": m.updated_at.isoformat(),
                }
                for m in memories
            ],
        }
        output = io.StringIO()
        output.write(json.dumps(data, indent=2))
        output.seek(0)
        return output

    @staticmethod
    def export_csv(memories: list) -> io.StringIO:
        """Export memories as CSV."""
        import csv
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Title", "Summary", "Created", "Updated", "People", "Places", "Events"])

        for m in memories:
            people = ",".join(m.structured_data.get("people", []))
            places = ",".join(m.structured_data.get("places", []))
            events = ",".join(m.structured_data.get("events", []))
            writer.writerow([
                m.id,
                m.title,
                m.summary,
                m.created_at.isoformat(),
                m.updated_at.isoformat(),
                people,
                places,
                events,
            ])

        output.seek(0)
        return output

    @staticmethod
    def export_pdf(memories: list, user_name: str = "User") -> io.BytesIO:
        """Export memories as PDF (requires reportlab)."""
        if not HAS_REPORTLAB:
            raise ImportError("reportlab is required for PDF export. Install with: pip install reportlab")

        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title page
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=30,
            alignment=1,  # center
        )
        story.append(Paragraph(f"Memory Export for {user_name}", title_style))
        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph(f"Exported on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", styles['Normal']))
        story.append(Spacer(1, 0.5 * inch))

        # Add memories
        for i, memory in enumerate(memories, 1):
            story.append(Paragraph(f"{i}. {memory.title}", styles['Heading2']))
            story.append(Spacer(1, 0.1 * inch))

            if memory.summary:
                story.append(Paragraph(f"<b>Summary:</b> {memory.summary}", styles['Normal']))
                story.append(Spacer(1, 0.1 * inch))

            # Add structured data
            if memory.structured_data:
                structured = memory.structured_data
                if structured.get("people"):
                    story.append(Paragraph(f"<b>People:</b> {', '.join(structured['people'])}", styles['Normal']))
                if structured.get("places"):
                    story.append(Paragraph(f"<b>Places:</b> {', '.join(structured['places'])}", styles['Normal']))
                if structured.get("events"):
                    story.append(Paragraph(f"<b>Events:</b> {', '.join(structured['events'])}", styles['Normal']))

            story.append(Spacer(1, 0.2 * inch))
            if i < len(memories):
                story.append(PageBreak())

        doc.build(story)
        output.seek(0)
        return output

    @staticmethod
    def export_proof_html(answer: str, query: str, proofs: list, user_name: str = "User") -> str:
        proof_blocks = []
        for index, proof in enumerate(proofs or [], 1):
            evidence = proof.get("evidence") or {}
            excerpt = evidence.get("excerpt") or proof.get("summary") or ""
            people = ", ".join(evidence.get("people") or [])
            places = ", ".join(evidence.get("places") or [])
            proof_blocks.append(
                f"""<article class="proof">
  <h3>{index}. {proof.get('title', 'Source memory')}</h3>
  <p class="meta">Confidence {proof.get('confidence', '—')} · {proof.get('memory_id', '')}</p>
  <p>{excerpt}</p>
  <p class="tags">{people} {places}</p>
</article>"""
            )
        proofs_html = "\n".join(proof_blocks) or "<p>No proofs attached.</p>"
        return f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Memory Proof Report</title>
<style>
body{{font-family:Georgia,serif;background:#f8fafc;color:#0f172a;margin:0;padding:40px}}
main{{max-width:860px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px}}
h1{{font-size:2rem;margin:0 0 .5rem}} .query{{color:#475569;font-style:italic}}
.answer{{background:#ecfeff;border-left:4px solid #0891b2;padding:16px 20px;margin:24px 0;line-height:1.7}}
.proof{{border-top:1px solid #e2e8f0;padding-top:18px;margin-top:18px}}
.meta,.tags{{font-size:.85rem;color:#64748b}}
</style></head>
<body><main>
<p class="meta">Memory Proof export for {user_name} · {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
<h1>Proof-backed answer</h1>
<p class="query">Question: {query}</p>
<div class="answer">{answer}</div>
<h2>Source proofs ({len(proofs or [])})</h2>
{proofs_html}
</main></body></html>"""

    @staticmethod
    def export_proof_pdf(answer: str, query: str, proofs: list, user_name: str = "User") -> io.BytesIO:
        if not HAS_REPORTLAB:
            raise ImportError("reportlab is required for PDF export. Install with: pip install reportlab")
        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=letter)
        styles = getSampleStyleSheet()
        story = [
            Paragraph(f"Memory Proof Report — {user_name}", styles["Heading1"]),
            Paragraph(f"Exported {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]),
            Spacer(1, 0.2 * inch),
            Paragraph(f"<b>Question:</b> {query}", styles["Normal"]),
            Spacer(1, 0.1 * inch),
            Paragraph(f"<b>Answer:</b> {answer}", styles["Normal"]),
            Spacer(1, 0.3 * inch),
            Paragraph("Source proofs", styles["Heading2"]),
        ]
        for index, proof in enumerate(proofs or [], 1):
            title = proof.get("title") or "Source memory"
            excerpt = (proof.get("evidence") or {}).get("excerpt") or proof.get("summary") or ""
            story.append(Paragraph(f"{index}. {title}", styles["Heading3"]))
            story.append(Paragraph(excerpt[:500], styles["Normal"]))
            story.append(Spacer(1, 0.15 * inch))
        doc.build(story)
        output.seek(0)
        return output


export_service = ExportService()
