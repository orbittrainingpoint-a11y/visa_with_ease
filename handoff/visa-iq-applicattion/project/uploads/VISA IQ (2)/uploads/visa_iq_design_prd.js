const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak, LevelFormat, Header, Footer,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

// ─── COLOR PALETTE ───────────────────────────────────────────────────────────
const C = {
  navy:       "0B1F4B",   // Primary brand
  royal:      "1A56DB",   // Accent blue
  gold:       "F59E0B",   // Success/premium
  teal:       "0EA5E9",   // Secondary
  green:      "10B981",   // Approved
  orange:     "F97316",   // Warning
  red:        "EF4444",   // Error/rejected
  purple:     "7C3AED",   // AI/premium
  white:      "FFFFFF",
  offWhite:   "F8FAFC",
  slate100:   "F1F5F9",
  slate200:   "E2E8F0",
  slate400:   "94A3B8",
  slate600:   "475569",
  slate800:   "1E293B",
  headerBg:   "0B1F4B",
  sectionBg:  "EFF6FF",
  tableBg:    "F0F7FF",
  tableHdr:   "1A56DB",
};

const border = (color = C.slate200) => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });
const allBorders = (color = C.slate200) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const allNoBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

function h1(text, color = C.navy) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.royal, space: 6 } },
    children: [new TextRun({ text, font: "Arial", size: 36, bold: true, color })]
  });
}

function h2(text, color = C.royal) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color })]
  });
}

function h3(text, color = C.navy) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color })]
  });
}

function h4(text, color = C.slate800) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: opts.size || 22, color: opts.color || C.slate600, bold: opts.bold || false, italics: opts.italic || false })]
  });
}

function bullet(text, level = 0, color = C.slate600) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 21, color })]
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 21, color: C.slate600 })]
  });
}

function spacer(lines = 1) {
  return new Paragraph({ spacing: { before: 0, after: lines * 120 }, children: [new TextRun("")] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function callout(label, text, bgColor = C.sectionBg, borderColor = C.royal) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: borderColor }, bottom: border(borderColor), left: { style: BorderStyle.SINGLE, size: 12, color: borderColor }, right: border(borderColor) },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 120 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: label, font: "Arial", size: 21, bold: true, color: borderColor })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text, font: "Arial", size: 20, color: C.slate600 })] })
        ]
      })]
    })]
  });
}

function colorBadge(text, bg, fg = C.white) {
  return new Table({
    width: { size: 1800, type: WidthType.DXA },
    columnWidths: [1800],
    rows: [new TableRow({ children: [new TableCell({
      borders: allNoBorders(),
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      width: { size: 1800, type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: "Arial", size: 18, bold: true, color: fg })] })]
    })]})],
  });
}

function sectionDivider(sectionNum, title, subtitle = "") {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: allNoBorders(),
      shading: { fill: C.headerBg, type: ShadingType.CLEAR },
      margins: { top: 300, bottom: 300, left: 360, right: 360 },
      width: { size: 9360, type: WidthType.DXA },
      children: [
        new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: sectionNum, font: "Arial", size: 28, bold: true, color: C.teal })] }),
        new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: subtitle ? 80 : 0 }, children: [new TextRun({ text: title, font: "Arial", size: 40, bold: true, color: C.white })] }),
        ...(subtitle ? [new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: subtitle, font: "Arial", size: 22, color: C.slate400 })] })] : [])
      ]
    })]})],
  });
}

function headerTable(cols, widths) {
  return new TableRow({
    tableHeader: true,
    children: cols.map((c, i) => new TableCell({
      borders: allBorders(C.royal),
      shading: { fill: C.tableHdr, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      width: { size: widths[i], type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: c, font: "Arial", size: 20, bold: true, color: C.white })] })]
    }))
  });
}

function dataRow(cells, widths, bg = C.white, center = false) {
  return new TableRow({
    children: cells.map((c, i) => new TableCell({
      borders: allBorders(C.slate200),
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: widths[i], type: WidthType.DXA },
      children: [new Paragraph({ alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: c, font: "Arial", size: 20, color: C.slate600 })] })]
    }))
  });
}

function simpleTable(headers, rows, widths, totalWidth = 9360) {
  const rowItems = rows.map((r, idx) => dataRow(r, widths, idx % 2 === 0 ? C.white : C.tableBg));
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerTable(headers, widths), ...rowItems]
  });
}

// ─── FRAME BOX ────────────────────────────────────────────────────────────────
function frameBox(title, elements, borderColor = C.royal) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({ children: [new TableCell({
        borders: { top: border(borderColor), bottom: noBorder(), left: { style: BorderStyle.SINGLE, size: 8, color: borderColor }, right: border(borderColor) },
        shading: { fill: C.headerBg, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 120 },
        width: { size: 9360, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: C.white })] })]
      })] }),
      new TableRow({ children: [new TableCell({
        borders: { top: noBorder(), bottom: border(borderColor), left: { style: BorderStyle.SINGLE, size: 8, color: borderColor }, right: border(borderColor) },
        shading: { fill: C.offWhite, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 120 },
        width: { size: 9360, type: WidthType.DXA },
        children: elements
      })] })
    ]
  });
}

// ─── TWO COLUMN LAYOUT ───────────────────────────────────────────────────────
function twoCol(left, right, leftWidth = 4500, rightWidth = 4680) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [leftWidth, rightWidth + 180],
    rows: [new TableRow({ children: [
      new TableCell({ borders: allNoBorders(), margins: { top: 0, bottom: 0, left: 0, right: 120 }, width: { size: leftWidth, type: WidthType.DXA }, children: left }),
      new TableCell({ borders: allNoBorders(), margins: { top: 0, bottom: 0, left: 120, right: 0 }, width: { size: rightWidth + 180, type: WidthType.DXA }, children: right })
    ]})]
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
        { level: 2, format: LevelFormat.BULLET, text: "\u25AA", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.DECIMAL, text: "%1.%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, font: "Arial", color: C.navy }, paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial", color: C.royal }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial", color: C.navy }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.royal } },
            spacing: { before: 0, after: 160 },
            children: [
              new TextRun({ text: "VisaIQ  |  Design System & Prototype PRD  |  v2.0", font: "Arial", size: 18, color: C.slate400 }),
              new TextRun({ text: "  •  Confidential", font: "Arial", size: 18, color: C.slate400, italics: true }),
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.slate200 } },
            spacing: { before: 120, after: 0 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: "VisaIQ Design System PRD — May 2026", font: "Arial", size: 18, color: C.slate400 }),
              new TextRun({ text: "\t", font: "Arial", size: 18 }),
              new TextRun({ text: "Page ", font: "Arial", size: 18, color: C.slate400 }),
              new PageNumber(),
            ]
          })
        ]
      })
    },
    children: [

      // ─── COVER PAGE ─────────────────────────────────────────────────────────
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: allNoBorders(),
          shading: { fill: C.headerBg, type: ShadingType.CLEAR },
          margins: { top: 600, bottom: 600, left: 480, right: 480 },
          width: { size: 9360, type: WidthType.DXA },
          children: [
            new Paragraph({ spacing: { before: 0, after: 200 }, children: [new TextRun({ text: "VISA", font: "Arial", size: 96, bold: true, color: C.white }), new TextRun({ text: "IQ", font: "Arial", size: 96, bold: true, color: C.teal })] }),
            new Paragraph({ spacing: { before: 0, after: 280 }, children: [new TextRun({ text: "AI-Powered Visa Intelligence Platform", font: "Arial", size: 32, color: C.slate400, italics: true })] }),
            new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C.teal } }, spacing: { before: 0, after: 280 }, children: [new TextRun({ text: "", font: "Arial", size: 22 })] }),
            new Paragraph({ spacing: { before: 280, after: 120 }, children: [new TextRun({ text: "DESIGN SYSTEM & PROTOTYPE PRD", font: "Arial", size: 44, bold: true, color: C.gold })] }),
            new Paragraph({ spacing: { before: 0, after: 160 }, children: [new TextRun({ text: "Full Interactive Design Specification", font: "Arial", size: 26, color: C.slate200 })] }),
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "Flutter (Web + Android) — All User Types", font: "Arial", size: 22, color: C.slate400 })] }),
            spacer(2),
            new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Document Version:", font: "Arial", size: 20, color: C.slate400, bold: true }), new TextRun({ text: "  2.0 — Design System Edition", font: "Arial", size: 20, color: C.white })] }),
            new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Date:", font: "Arial", size: 20, color: C.slate400, bold: true }), new TextRun({ text: "  May 2026", font: "Arial", size: 20, color: C.white })] }),
            new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Platform:", font: "Arial", size: 20, color: C.slate400, bold: true }), new TextRun({ text: "  Flutter (Web + Android + iOS)", font: "Arial", size: 20, color: C.white })] }),
            new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "Status:", font: "Arial", size: 20, color: C.slate400, bold: true }), new TextRun({ text: "  READY FOR DESIGN HANDOFF", font: "Arial", size: 20, color: C.green })] }),
          ]
        })]})],
      }),

      pageBreak(),

      // ─── TABLE OF CONTENTS ──────────────────────────────────────────────────
      h1("Table of Contents"),
      spacer(1),
      simpleTable(
        ["#", "Section Title", "Page"],
        [
          ["01", "Design System Foundation", "4"],
          ["02", "Color Tokens & Semantic System", "6"],
          ["03", "Typography System", "8"],
          ["04", "Spacing, Grid & Layout System", "10"],
          ["05", "Component Library — Core Components", "12"],
          ["06", "Component Library — Form Components", "16"],
          ["07", "Component Library — Feedback & Status", "19"],
          ["08", "Navigation Architecture", "22"],
          ["09", "User Types & Role-Based UX", "25"],
          ["10", "Frame-by-Frame: Onboarding & Auth", "27"],
          ["11", "Frame-by-Frame: Tourist / Consumer User", "32"],
          ["12", "Frame-by-Frame: Professional B2C User", "42"],
          ["13", "Frame-by-Frame: HR Manager B2B User", "50"],
          ["14", "Frame-by-Frame: Admin User", "58"],
          ["15", "AI Interaction Design Patterns", "64"],
          ["16", "Document Audit UX & Prototype Flow", "68"],
          ["17", "Web Responsive Design Specification", "74"],
          ["18", "Flutter-Specific Implementation Notes", "80"],
          ["19", "Interaction & Animation Specification", "83"],
          ["20", "Accessibility & Inclusive Design", "86"],
        ],
        [480, 6960, 1920]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 01 — DESIGN SYSTEM FOUNDATION
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("01", "Design System Foundation", "Principles, Brand Identity & Design Language"),
      spacer(1),

      h2("1.1 Design Principles"),
      para("VisaIQ's design system is built around five core principles that guide every interaction, component, and visual decision across the platform."),
      spacer(1),
      simpleTable(
        ["Principle", "Description", "Applied To"],
        [
          ["Clarity First", "Reduce cognitive load. Visa applications are already stressful — every screen must be immediately understandable without instructions.", "All flows, forms, dashboards"],
          ["Trust Through Transparency", "Show AI confidence scores, source citations, and disclaimers prominently. Users must never feel misled by AI output.", "Audit results, Requirements, Chat"],
          ["Progressive Disclosure", "Show only what's needed at each step. Hide complexity behind well-labeled expandable sections.", "Onboarding wizard, Document audit"],
          ["Platform Authenticity", "On Android, follow Material Design 3 patterns. On Web, extend with refined elevations and larger touch targets for mouse.", "Navigation, Cards, Inputs"],
          ["Accessible by Default", "WCAG 2.1 AA compliance is not a post-launch task. Every component ships with correct contrast, labels, and keyboard behavior.", "All components"],
        ],
        [1800, 4680, 2880]
      ),

      spacer(1),
      h2("1.2 Brand Identity System"),
      para("The VisaIQ brand communicates authority, intelligence, and accessibility. It blends the seriousness of government process with the warmth of a human advisor."),
      spacer(1),
      frameBox("Brand Voice & Personality", [
        para("KNOWLEDGEABLE — Speaks with expertise but never condescends. Uses plain language for complex visa concepts.", { color: C.slate800 }),
        para("REASSURING — Acknowledges that visa applications are stressful and positions itself as a steady guide.", { color: C.slate800 }),
        para("PRECISE — Never vague. Every AI output includes a confidence score, source, or explicit limitation.", { color: C.slate800 }),
        para("HUMAN — Despite being AI-powered, conversations feel personal and contextual, not robotic.", { color: C.slate800 }),
      ]),

      spacer(1),
      h2("1.3 Logo & Brand Mark"),
      simpleTable(
        ["Usage Context", "Variant", "Minimum Size", "Clear Space"],
        [
          ["App bar (mobile)", "Wordmark: VisaIQ — light text on navy", "24dp height", "8dp all sides"],
          ["Splash/Loading screen", "Icon mark + wordmark — centered on navy", "48dp height", "16dp all sides"],
          ["Web header", "Wordmark — navy or white depending on bg", "32px height", "12px all sides"],
          ["PDF reports", "Icon + wordmark — navy on white", "40px height", "16px all sides"],
          ["App store icon", "Icon mark only — navy bg, white IQ symbol", "1024x1024px", "N/A"],
          ["Favicon", "IQ monogram on navy circle", "32x32px", "N/A"],
        ],
        [2400, 3000, 1680, 2280]
      ),

      spacer(1),
      h2("1.4 Design Token Architecture"),
      para("All visual decisions flow from a three-tier token system: Primitive Tokens → Semantic Tokens → Component Tokens. This enables platform-specific theming while maintaining visual consistency."),
      spacer(1),
      callout("Token Tier System", "TIER 1 PRIMITIVES: Raw values (colors, sizes, radii) — never used directly in components\nTIER 2 SEMANTIC: Purpose-assigned tokens (color-surface-primary, spacing-component-gap) — used in component specs\nTIER 3 COMPONENT: Widget-specific tokens (button-primary-bg, card-header-padding) — used in Flutter widget implementation", C.sectionBg, C.royal),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 02 — COLOR SYSTEM
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("02", "Color Tokens & Semantic System", "Full Light & Dark Mode Palette with Accessibility Ratios"),
      spacer(1),

      h2("2.1 Primitive Color Palette"),
      simpleTable(
        ["Token Name", "Hex Value", "Usage", "WCAG on White", "WCAG on Navy"],
        [
          ["navy-900", "#0B1F4B", "Primary brand, nav bg", "8.9:1 AAA", "—"],
          ["royal-600", "#1A56DB", "CTA buttons, links, active states", "4.6:1 AA", "2.1:1 (avoid text)"],
          ["teal-500", "#0EA5E9", "Secondary actions, AI indicator", "3.1:1 AA large", "5.1:1 AA"],
          ["gold-400", "#F59E0B", "Premium badge, warnings", "2.1:1 (large only)", "6.2:1 AA"],
          ["green-500", "#10B981", "Success, approved status", "3.0:1 AA large", "5.8:1 AA"],
          ["orange-500", "#F97316", "Warning, attention required", "2.9:1 (large only)", "6.0:1 AA"],
          ["red-500", "#EF4444", "Error, rejected status", "4.0:1 AA large", "7.1:1 AAA"],
          ["purple-600", "#7C3AED", "AI-powered feature indicator", "5.6:1 AA", "2.8:1 (large only)"],
          ["slate-50", "#F8FAFC", "Page background", "—", "—"],
          ["slate-100", "#F1F5F9", "Card backgrounds", "—", "—"],
          ["slate-200", "#E2E8F0", "Borders, dividers", "—", "—"],
          ["slate-400", "#94A3B8", "Placeholder, disabled", "2.8:1 (large only)", "—"],
          ["slate-600", "#475569", "Secondary text", "5.9:1 AA", "—"],
          ["slate-800", "#1E293B", "Primary text", "11.6:1 AAA", "—"],
          ["white", "#FFFFFF", "Surfaces, text on dark", "—", "8.9:1 AAA"],
        ],
        [2000, 1400, 2800, 1800, 1360]
      ),

      spacer(1),
      h2("2.2 Semantic Color Tokens"),
      para("These tokens map primitive colors to their semantic purpose. Flutter implementation uses ThemeData.colorScheme with these mappings:"),
      simpleTable(
        ["Semantic Token", "Light Mode", "Dark Mode", "Purpose"],
        [
          ["color.background.primary", "slate-50 (#F8FAFC)", "slate-950 (#0F172A)", "Page/screen background"],
          ["color.background.secondary", "white (#FFFFFF)", "slate-900 (#0F172A)", "Card & surface background"],
          ["color.background.tertiary", "slate-100 (#F1F5F9)", "slate-800 (#1E293B)", "Input fields, chips"],
          ["color.background.brand", "navy-900 (#0B1F4B)", "navy-900 (#0B1F4B)", "App bar, nav drawer"],
          ["color.text.primary", "slate-800 (#1E293B)", "slate-50 (#F8FAFC)", "Headings, primary labels"],
          ["color.text.secondary", "slate-600 (#475569)", "slate-400 (#94A3B8)", "Body text, subtitles"],
          ["color.text.disabled", "slate-400 (#94A3B8)", "slate-600 (#475569)", "Disabled controls, hints"],
          ["color.text.onBrand", "white (#FFFFFF)", "white (#FFFFFF)", "Text on navy/colored bg"],
          ["color.action.primary", "royal-600 (#1A56DB)", "teal-500 (#0EA5E9)", "Primary CTA buttons"],
          ["color.action.primaryHover", "#1547C0", "#38BDF8", "Button hover state"],
          ["color.action.primaryPressed", "#1039A0", "#0EA5E9", "Button pressed state"],
          ["color.status.success", "green-500 (#10B981)", "#34D399", "Approved, complete"],
          ["color.status.warning", "orange-500 (#F97316)", "#FB923C", "Attention needed"],
          ["color.status.error", "red-500 (#EF4444)", "#F87171", "Errors, rejection"],
          ["color.status.info", "teal-500 (#0EA5E9)", "#38BDF8", "Information, AI output"],
          ["color.ai.indicator", "purple-600 (#7C3AED)", "#A78BFA", "AI-generated content marker"],
          ["color.border.default", "slate-200 (#E2E8F0)", "#334155", "Component borders"],
          ["color.border.focus", "royal-600 (#1A56DB)", "teal-500 (#0EA5E9)", "Focused input border"],
        ],
        [2400, 2000, 2000, 2960]
      ),

      spacer(1),
      h2("2.3 Status Color Semantics for Visa States"),
      simpleTable(
        ["Visa/Doc Status", "Color Token", "Icon", "Usage Context"],
        [
          ["APPROVED / COMPLETE", "color.status.success (green)", "check_circle_outline", "Application approved, document valid"],
          ["UNDER REVIEW", "color.action.primary (royal blue)", "hourglass_top", "Submitted, awaiting embassy decision"],
          ["ATTENTION NEEDED", "color.status.warning (orange)", "warning_amber", "Missing documents, low audit score"],
          ["REJECTED / ERROR", "color.status.error (red)", "cancel_outlined", "Application rejected, invalid document"],
          ["DRAFT / INCOMPLETE", "slate-400 (grey)", "edit_outlined", "Started but not submitted"],
          ["AI PROCESSING", "color.ai.indicator (purple)", "auto_awesome", "AI audit or search in progress"],
          ["EXPIRED", "color.status.error (red)", "event_busy", "Passport, insurance, or doc expired"],
          ["PREMIUM / VIP", "gold-400 (gold)", "workspace_premium", "VIP booking, premium features"],
        ],
        [2200, 2200, 1960, 3000]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 03 — TYPOGRAPHY
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("03", "Typography System", "Font Hierarchy, Scale & Text Styles"),
      spacer(1),

      h2("3.1 Font Family Selection"),
      simpleTable(
        ["Font", "Usage", "Rationale", "Flutter Implementation"],
        [
          ["Inter", "All UI text — labels, body, captions", "Superior legibility at small sizes, geometric clarity, wide language support", "google_fonts: GoogleFonts.inter()"],
          ["Plus Jakarta Sans", "Display headings, marketing text", "Modern, trustworthy feel for financial/legal domain", "google_fonts: GoogleFonts.plusJakartaSans()"],
          ["JetBrains Mono", "Tracking numbers, reference codes, technical IDs", "Monospace clarity for application reference numbers", "google_fonts: GoogleFonts.jetBrainsMono()"],
          ["System fallback", "Native OS dialogs only", "Matches platform conventions where needed", "Theme.of(context).textTheme"],
        ],
        [2000, 2200, 3000, 2160]
      ),

      spacer(1),
      h2("3.2 Type Scale — Mobile (Flutter)"),
      simpleTable(
        ["Token", "Font", "Size (sp)", "Weight", "Line Height", "Usage"],
        [
          ["text.display.large", "Plus Jakarta Sans", "36sp", "700 Bold", "1.2", "Splash screen title"],
          ["text.display.medium", "Plus Jakarta Sans", "28sp", "700 Bold", "1.25", "Screen titles"],
          ["text.display.small", "Plus Jakarta Sans", "24sp", "600 SemiBold", "1.3", "Section headers"],
          ["text.headline.large", "Inter", "22sp", "600 SemiBold", "1.35", "Card titles, form section headers"],
          ["text.headline.medium", "Inter", "20sp", "600 SemiBold", "1.4", "List item titles, modal titles"],
          ["text.headline.small", "Inter", "18sp", "600 SemiBold", "1.4", "Subsection labels"],
          ["text.body.large", "Inter", "16sp", "400 Regular", "1.5", "Primary body text, descriptions"],
          ["text.body.medium", "Inter", "14sp", "400 Regular", "1.5", "Secondary body, list descriptions"],
          ["text.body.small", "Inter", "12sp", "400 Regular", "1.5", "Helper text, footnotes"],
          ["text.label.large", "Inter", "14sp", "500 Medium", "1.4", "Form field labels"],
          ["text.label.medium", "Inter", "12sp", "500 Medium", "1.4", "Chip labels, tags, badges"],
          ["text.label.small", "Inter", "11sp", "500 Medium", "1.3", "Caption text, timestamps"],
          ["text.code", "JetBrains Mono", "13sp", "400 Regular", "1.5", "App ref IDs, tracking codes"],
        ],
        [2000, 1800, 960, 1200, 1200, 2200]
      ),

      spacer(1),
      h2("3.3 Type Scale — Web (Flutter Web)"),
      simpleTable(
        ["Token", "Font", "Size (px)", "Weight", "Usage"],
        [
          ["text.web.hero", "Plus Jakarta Sans", "56px", "800 ExtraBold", "Hero section headline"],
          ["text.web.h1", "Plus Jakarta Sans", "40px", "700 Bold", "Page titles"],
          ["text.web.h2", "Plus Jakarta Sans", "32px", "700 Bold", "Section titles"],
          ["text.web.h3", "Plus Jakarta Sans", "24px", "600 SemiBold", "Subsection headers"],
          ["text.web.h4", "Inter", "20px", "600 SemiBold", "Card titles"],
          ["text.web.body.lg", "Inter", "16px", "400 Regular", "Main body text"],
          ["text.web.body.md", "Inter", "14px", "400 Regular", "Secondary text"],
          ["text.web.body.sm", "Inter", "12px", "400 Regular", "Captions, helper"],
          ["text.web.label", "Inter", "14px", "500 Medium", "Form labels, table headers"],
          ["text.web.code", "JetBrains Mono", "14px", "400 Regular", "Reference codes, IDs"],
        ],
        [2000, 1800, 1200, 1500, 2860]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 04 — SPACING, GRID & LAYOUT
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("04", "Spacing, Grid & Layout System", "8dp Base Grid — Mobile & Web Breakpoints"),
      spacer(1),

      h2("4.1 Spacing Scale (8dp Base)"),
      simpleTable(
        ["Token", "Value", "Flutter", "Common Usage"],
        [
          ["spacing.1", "4dp", "SizedBox(height: 4)", "Icon gap, tight inline spacing"],
          ["spacing.2", "8dp", "SizedBox(height: 8)", "Between label and input, chip gap"],
          ["spacing.3", "12dp", "SizedBox(height: 12)", "Within list items, icon + text"],
          ["spacing.4", "16dp", "SizedBox(height: 16)", "Card internal padding, list item height add"],
          ["spacing.5", "20dp", "SizedBox(height: 20)", "Section gap (tight)"],
          ["spacing.6", "24dp", "SizedBox(height: 24)", "Primary component gap, form fields"],
          ["spacing.8", "32dp", "SizedBox(height: 32)", "Section dividers"],
          ["spacing.10", "40dp", "SizedBox(height: 40)", "Large section breaks"],
          ["spacing.12", "48dp", "SizedBox(height: 48)", "Screen padding top/bottom"],
          ["spacing.16", "64dp", "SizedBox(height: 64)", "Hero element spacing"],
        ],
        [1400, 1000, 2400, 4560]
      ),

      spacer(1),
      h2("4.2 Layout Grid — Mobile"),
      simpleTable(
        ["Device", "Columns", "Gutter", "Margin", "Max Content Width"],
        [
          ["Phone portrait (<600dp)", "4", "16dp", "16dp", "Full width"],
          ["Phone landscape (600–839dp)", "8", "16dp", "24dp", "Full width"],
          ["Tablet portrait (600–1023dp)", "8", "24dp", "24dp", "Full width"],
          ["Tablet landscape (≥1024dp)", "12", "24dp", "24dp", "960dp max"],
        ],
        [2800, 1200, 1200, 1200, 2960]
      ),

      spacer(1),
      h2("4.3 Layout Grid — Web Breakpoints"),
      simpleTable(
        ["Breakpoint", "Width", "Columns", "Gutter", "Margin", "Layout Behavior"],
        [
          ["xs", "<480px", "4", "12px", "16px", "Single column, stacked navigation"],
          ["sm", "480–767px", "4", "16px", "20px", "Mobile-style nav, wider cards"],
          ["md", "768–1023px", "8", "20px", "32px", "Tablet: sidebar appears as overlay"],
          ["lg", "1024–1279px", "12", "24px", "40px", "Desktop: persistent sidebar 240px"],
          ["xl", "1280–1535px", "12", "24px", "auto", "Max content 1200px centered"],
          ["2xl", "≥1536px", "12", "32px", "auto", "Max content 1400px centered"],
        ],
        [900, 1100, 900, 900, 900, 3760]
      ),

      spacer(1),
      h2("4.4 Border Radius Tokens"),
      simpleTable(
        ["Token", "Value", "Usage"],
        [
          ["radius.xs", "4dp/px", "Chips, small badges, image corners"],
          ["radius.sm", "8dp/px", "Input fields, small cards, tooltips"],
          ["radius.md", "12dp/px", "Standard cards, bottom sheets (inner)"],
          ["radius.lg", "16dp/px", "Feature cards, modals, dialogs"],
          ["radius.xl", "24dp/px", "Bottom sheets (outer), large panels"],
          ["radius.2xl", "32dp/px", "Floating cards, premium panels"],
          ["radius.full", "9999dp/px", "Pills, circular icons, avatar frames"],
        ],
        [1600, 1200, 6560]
      ),

      spacer(1),
      h2("4.5 Elevation & Shadow Tokens"),
      simpleTable(
        ["Token", "Shadow Value (Flutter BoxShadow)", "Usage"],
        [
          ["elevation.0", "none", "Flat surfaces on background"],
          ["elevation.1", "BoxShadow(blurRadius:4, offset:0,2, color:10%black)", "Input fields, chip borders"],
          ["elevation.2", "BoxShadow(blurRadius:8, offset:0,4, color:12%black)", "Cards, standard modals"],
          ["elevation.3", "BoxShadow(blurRadius:16, offset:0,8, color:15%black)", "Dropdowns, tooltips, floating"],
          ["elevation.4", "BoxShadow(blurRadius:24, offset:0,12, color:18%black)", "Bottom sheets, search overlay"],
          ["elevation.5", "BoxShadow(blurRadius:40, offset:0,20, color:25%black)", "Full-screen dialogs, critical modals"],
        ],
        [1600, 4400, 3360]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 05 — CORE COMPONENT LIBRARY
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("05", "Component Library — Core Components", "Buttons, Cards, Navigation, Chips, Badges"),
      spacer(1),

      h2("5.1 Button Component System"),
      para("All buttons must meet minimum touch target of 48x48dp (Android) and 44x44pt (iOS). Web buttons: minimum 36px height with keyboard focus rings."),
      spacer(1),

      frameBox("Button Hierarchy — 5 Variants", [
        h4("FILLED (Primary) — Use for the single most important action per screen"),
        para("Height: 52dp | Padding: 24dp horizontal | Border radius: radius.md (12dp) | Text: text.label.large, weight 600"),
        para("Background: color.action.primary | Text: white | Pressed: action.primaryPressed + scale(0.97) | Disabled: slate-200 bg, slate-400 text"),
        para("Loading state: circular progress (16dp, white) replaces text | Width: fixed or full-width (avoid full-width on web)"),
        spacer(1),
        h4("FILLED TONAL (Secondary) — Secondary important action"),
        para("Height: 52dp | Background: royal-50 (#EFF6FF) | Text: color.action.primary | Pressed: royal-100 | Disabled: slate-100 bg, slate-400 text"),
        spacer(1),
        h4("OUTLINED — Lower emphasis, often Cancel or alternative action"),
        para("Height: 52dp | Background: transparent | Border: 1.5dp color.border.default | Text: color.text.primary | Pressed: slate-100 overlay | Focus: 2dp royal border"),
        spacer(1),
        h4("TEXT — Lowest emphasis, inline actions (e.g. 'Learn more', 'Skip')"),
        para("Height: 44dp | Background: transparent | Text: color.action.primary | Pressed: royal-50 overlay | Padding: 8dp horizontal"),
        spacer(1),
        h4("DESTRUCTIVE — Irreversible actions (Delete, Reject)"),
        para("Height: 52dp | Background: red-600 (#DC2626) | Text: white | Pressed: red-700 | Always preceded by confirmation dialog"),
      ]),

      spacer(1),
      h2("5.2 Icon Button Variants"),
      simpleTable(
        ["Variant", "Size", "Shape", "Usage"],
        [
          ["Standard icon button", "48x48dp", "Rounded square, radius.sm", "Toolbar actions, list item actions"],
          ["Filled icon button", "48x48dp", "Rounded square, color.action.primary bg", "Primary single action (e.g. Send chat)"],
          ["Circular FAB", "56x56dp", "radius.full, elevation.3", "Primary floating action per screen"],
          ["Extended FAB", "52dp height", "radius.xl, icon + label", "Primary action with text label"],
          ["Icon-only nav item", "48x48dp", "No bg, active indicator below", "Bottom nav, rail nav"],
        ],
        [2200, 1200, 2200, 3760]
      ),

      spacer(1),
      h2("5.3 Card Component System"),
      frameBox("Card Variants & Anatomy", [
        h4("STANDARD CARD"),
        para("Background: color.background.secondary | Border radius: radius.md | Elevation: elevation.2 | Padding: 16dp | Border: none in light mode, 1dp slate-200 in dark mode"),
        para("Contains: optional header row (icon + title + subtitle + trailing action), content area, optional divider, optional action row"),
        spacer(1),
        h4("ELEVATED CARD (Dashboard Feature Cards)"),
        para("Elevation: elevation.3 | Border radius: radius.lg | Left accent border: 3dp color.action.primary"),
        para("Used for: Application status cards, AI audit summary cards"),
        spacer(1),
        h4("STATUS CARD (Application Status)"),
        para("Left border: 4dp color.status.[success|warning|error|info] | Background: slightly tinted (5% opacity status color) | Status badge top-right"),
        spacer(1),
        h4("DOCUMENT CARD"),
        para("Width: 160dp (mobile), 200dp (tablet/web) | Height: 200dp | Contains: file type icon (48dp), filename, upload date, audit score ring, quick-action button"),
        spacer(1),
        h4("METRIC CARD (Dashboard Stats)"),
        para("Square-ish proportion | Large number display: text.display.medium | Label: text.body.small | Trend indicator: arrow up/down icon with percentage"),
        spacer(1),
        h4("PREMIUM / VIP CARD"),
        para("Background: gradient linear from navy-900 to royal-600 | Gold border: 1.5dp gold-400 | Text: white | AI glow effect on icon: purple shimmer"),
      ]),

      spacer(1),
      h2("5.4 List Tile Component"),
      simpleTable(
        ["Property", "Specification"],
        [
          ["Minimum height", "56dp (single line), 72dp (two line), 88dp (three line)"],
          ["Leading element", "Icon (24dp), avatar (40dp), image (56dp), or checkbox"],
          ["Leading inset", "16dp from screen edge to leading element"],
          ["Content area", "Headline: text.body.large | Supporting text: text.body.medium, color.text.secondary"],
          ["Trailing element", "Icon (24dp), text (text.label.medium), switch, or radio"],
          ["Divider", "1dp slate-200, inset 16dp from leading element (not full width)"],
          ["Pressed state", "Ripple effect: slate-200 @ 12% opacity, 200ms fade"],
          ["Selected state", "Left accent: 3dp color.action.primary | Background: royal-50 tint"],
        ],
        [2400, 6960]
      ),

      spacer(1),
      h2("5.5 Chip & Badge Components"),
      simpleTable(
        ["Component", "Height", "Padding", "Usage", "Key States"],
        [
          ["Filter chip", "32dp", "12dp H, 8dp V", "Document type filters, nationality filter", "Unselected: outlined | Selected: filled royal-600"],
          ["Input chip", "32dp", "12dp H, 8dp V", "Tags on uploaded documents", "Has remove (X) button"],
          ["Assist chip", "32dp", "12dp H, 8dp V", "Suggested AI actions in chat", "Outlined, single-use, disappears after tap"],
          ["Status badge", "20dp", "6dp H, 2dp V", "Application status indicators", "Fixed color per status, no interaction"],
          ["Count badge", "16dp", "4dp H", "Notification count on nav items", "Auto-hides at 0, shows '99+' at limit"],
          ["AI badge", "24dp", "8dp H", "Marks AI-generated content", "Purple-600 bg, white text, sparkle icon"],
        ],
        [1600, 900, 1600, 2400, 2860]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 06 — FORM COMPONENTS
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("06", "Component Library — Form Components", "Inputs, Selectors, Upload & Validation Patterns"),
      spacer(1),

      h2("6.1 Text Field System"),
      frameBox("Text Field Anatomy & States", [
        para("ALL text fields follow Material Design 3 Outlined Text Field pattern with VisaIQ semantic tokens:"),
        spacer(1),
        h4("Base Specifications"),
        para("Height: 56dp (mobile), 52px (web) | Border radius: radius.sm (8dp) | Border: 1.5dp"),
        para("Label behavior: Floating label — rests at center when empty, floats to top-left when focused or filled"),
        para("Padding: 16dp horizontal, 12dp vertical"),
        spacer(1),
        h4("State Definitions"),
        para("DEFAULT: Border color.border.default (slate-200) | Label: color.text.secondary"),
        para("FOCUSED: Border 2dp color.border.focus (royal-600) | Label floats: color.action.primary | Background: slight royal tint 3%"),
        para("FILLED: Border color.border.default | Label floated with filled value"),
        para("ERROR: Border red-500 | Error message below: text.body.small, red-500, with error_outline icon"),
        para("DISABLED: Border slate-200 | Background slate-100 | Text slate-400 | Cursor not-allowed (web)"),
        para("SUCCESS: Border green-500 | Trailing check_circle icon: green-500"),
        spacer(1),
        h4("Field Types for VisaIQ"),
        para("Passport number: monospace font (JetBrains Mono), uppercase transform, masked input pattern"),
        para("Date fields: date picker (calendar popup) rather than free text for DOB, travel dates"),
        para("Country selector: searchable dropdown with flag emoji + country name"),
        para("Currency fields: currency symbol prefix, number keyboard, 2 decimal places"),
        para("Document notes: multi-line (3 rows min), expandable to 6 rows"),
      ]),

      spacer(1),
      h2("6.2 Dropdown & Select Components"),
      simpleTable(
        ["Component", "Trigger", "Max Height", "Search", "Usage in VisaIQ"],
        [
          ["Country picker", "Text field + arrow", "300dp", "Yes — autocomplete", "Nationality, destination country"],
          ["Visa type selector", "Bottom sheet (mobile) / Dropdown (web)", "400dp", "Optional filter chips", "F01 onboarding, new application"],
          ["Currency selector", "Inline dropdown in text field", "240dp", "No", "Payment, budget fields"],
          ["Document type picker", "Bottom sheet", "350dp", "No — icons + labels", "Document upload categorization"],
          ["Year picker", "Spinner (mobile) / Grid (web)", "N/A", "N/A", "Travel year, passport year"],
          ["Multi-select filter", "Filter chip row", "N/A", "N/A", "Dashboard filter bar"],
        ],
        [2000, 2400, 1400, 1200, 2360]
      ),

      spacer(1),
      h2("6.3 Document Upload Component"),
      frameBox("Upload Zone — Full Specification", [
        h4("UPLOAD ZONE (Inactive)"),
        para("Size: full width, 140dp height (mobile), 120px height (web)"),
        para("Style: dashed border 2dp royal-300, border radius.lg, background royal-50"),
        para("Content: cloud_upload icon (48dp, royal-400) + 'Tap to upload or drag a file' text + supported formats label"),
        spacer(1),
        h4("UPLOAD ZONE (Drag hover — web only)"),
        para("Background: royal-100 | Border: solid 2dp royal-600 | Icon: animate scale 1.1 | Text: changes to 'Drop file to upload'"),
        spacer(1),
        h4("UPLOAD ZONE (Processing)"),
        para("Background: purple-50 | Circular progress indicator (royal-600) | 'AI Auditing...' text with animated ellipsis | Cancel button (text, red)"),
        spacer(1),
        h4("DOCUMENT CARD (Uploaded — Pending Audit)"),
        para("Width: full in list mode, 160dp in grid mode | Height: 88dp list, 200dp grid"),
        para("Contents: File type icon (48dp) | Filename (truncated) | File size | Upload timestamp | Status chip: 'Pending Audit' (orange)"),
        spacer(1),
        h4("DOCUMENT CARD (Audit Complete)"),
        para("Audit score ring: circular progress (40dp diameter) with score 0-100, color-coded: 0-49 red, 50-74 orange, 75-89 yellow, 90-100 green"),
        para("Status chip: 'Audit Complete' (green) | 'View Report' action button | Critical issues count badge"),
      ]),

      spacer(1),
      h2("6.4 Stepper / Progress Wizard Component"),
      para("Used for: Onboarding wizard (4 steps), New Application wizard (5 steps), VIP booking flow (3 steps)"),
      simpleTable(
        ["Property", "Mobile Specification", "Web Specification"],
        [
          ["Visual style", "Top horizontal stepper — step dots connected by line", "Vertical sidebar stepper (web) or horizontal (narrow)"],
          ["Step indicator", "Filled circle: active (royal-600), complete (green-500, checkmark), future (slate-200)", "Same colors + step labels always visible"],
          ["Progress line", "Horizontal line between dots: filled on completion", "Vertical line: animated fill on step complete"],
          ["Step labels", "Below dots, text.label.small, visible only on wide screens", "Always visible right of indicator"],
          ["Navigation buttons", "Back (outlined) + Continue/Next (filled) — bottom of screen", "Bottom of content area or sidebar sticky"],
          ["Validation", "Button disabled until required fields complete | Shake animation on invalid attempt", "Same + inline inline field error highlighting"],
        ],
        [2400, 3480, 3480]
      ),

      spacer(1),
      h2("6.5 Validation & Error Patterns"),
      simpleTable(
        ["Validation Type", "Timing", "Visual Treatment", "Example"],
        [
          ["Required field", "On blur (lost focus)", "Red border + 'This field is required' below field", "Passport number"],
          ["Format validation", "Real-time (debounced 400ms)", "Red border + specific format error message", "'Enter a valid passport number'"],
          ["Cross-field validation", "On form submit attempt", "Error banner at top + highlight all affected fields", "Name mismatch across docs"],
          ["API/backend error", "After submit response", "Toast notification (red) + field re-highlight if specific", "'Verification failed. Please try again.'"],
          ["Success validation", "On blur when valid", "Green border + check icon trailing field", "Valid passport number confirmed"],
          ["Warning (non-blocking)", "After save", "Orange banner with action suggestion", "'Bank statement is 7 months old — visa may require 6 months'"],
        ],
        [2200, 1600, 2600, 2960]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 07 — FEEDBACK & STATUS COMPONENTS
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("07", "Component Library — Feedback & Status", "Toasts, Alerts, Loading States, Empty States, Dialogs"),
      spacer(1),

      h2("7.1 Toast / Snackbar System"),
      simpleTable(
        ["Type", "Color", "Icon", "Duration", "Action", "Position"],
        [
          ["Success", "Green-600 bg, white text", "check_circle", "3 seconds", "Optional 'View'", "Bottom center (mobile), top-right (web)"],
          ["Error", "Red-600 bg, white text", "error", "6 seconds", "Mandatory 'Retry' or 'Dismiss'", "Bottom center (mobile), top-right (web)"],
          ["Warning", "Orange-500 bg, white text", "warning", "5 seconds", "Optional action", "Bottom center (mobile), top-right (web)"],
          ["Info", "Royal-600 bg, white text", "info", "4 seconds", "Optional 'Learn more'", "Bottom center (mobile), top-right (web)"],
          ["AI Processing", "Purple-600 bg, white text", "auto_awesome", "Until complete", "Optional 'Cancel'", "Bottom center"],
          ["Offline", "Slate-800 bg, white text", "wifi_off", "Persistent", "Dismiss when online", "Bottom fixed (above nav)"],
        ],
        [1200, 1600, 1200, 1200, 1800, 2360]
      ),
      para("Animation: slide-up from bottom (mobile), slide-in from right (web) | Duration: 250ms ease-out | Dismiss: swipe (mobile), X button (web) + auto-dismiss"),

      spacer(1),
      h2("7.2 Alert Banner Component"),
      para("Fixed to top of screen content area (below app bar). Used for persistent warnings that require user acknowledgment."),
      simpleTable(
        ["Usage", "Color Treatment", "Example Text"],
        [
          ["AI data staleness warning", "Orange bg, orange-800 border, orange icon", "'Requirements data is 18+ hours old. Verify before submitting.'"],
          ["Legal disclaimer", "Blue bg, royal border, info icon", "'VisaIQ provides guidance only. Not legal advice. Always verify with official embassy.'"],
          ["GDPR data consent", "Slate bg, slate border, shield icon", "'Your documents are processed and auto-deleted within 72 hours.'"],
          ["Offline mode active", "Slate-800 bg, white text, wifi_off icon", "'You are offline. Showing cached data. Some features unavailable.'"],
          ["New requirements found", "Green bg, green border, new_releases icon", "'Embassy requirements updated 2 hours ago. Refresh to see changes.'"],
        ],
        [2400, 2400, 4560]
      ),

      spacer(1),
      h2("7.3 Loading State Patterns"),
      simpleTable(
        ["Context", "Loading Pattern", "Skeleton/Placeholder", "Cancel Option"],
        [
          ["Initial screen load", "Full-screen skeleton layout matching content structure", "Card skeletons, text line skeletons", "No"],
          ["Document upload", "Upload progress bar (linear, royal-600)", "Document card with progress overlay", "Yes — cancel upload"],
          ["AI audit processing", "Animated pulsing ring on document card + phase label", "'Analyzing document...' → 'Checking validity...' → 'Generating report...'", "Yes — after 5 seconds"],
          ["Requirements search", "Typing animation + 'Searching official sources...' text", "Skeleton requirement cards (3 items)", "No — fast (<3s)"],
          ["Chat response", "Animated typing dots (3 dots, royal-600) in message bubble", "N/A — streaming response", "No"],
          ["Dashboard load", "Top-level skeleton: 3 metric cards + 2 application cards", "Shimmer animation on skeleton", "No"],
          ["PDF generation", "Full-screen modal: progress steps checklist", "'Gathering data...' → 'Generating pages...' → 'Finalizing...'", "No — fast"],
        ],
        [2200, 2600, 2800, 1760]
      ),

      spacer(1),
      h2("7.4 Empty State Components"),
      simpleTable(
        ["Screen", "Illustration", "Headline", "Body Text", "CTA"],
        [
          ["No applications yet", "Passport + airplane illustration", "Start Your First Application", "Tell us where you're going and we'll guide you through the process.", "Start Application (filled button)"],
          ["No documents uploaded", "Upload cloud illustration", "No Documents Yet", "Upload your passport, bank statements, and supporting docs to get your AI audit.", "Upload Documents (filled button)"],
          ["No chat history", "Chat bubble + star illustration", "Ask VisaIQ Anything", "I have your application context. Ask about requirements, documents, or visa tips.", "Try: 'Am I ready to apply?' (assist chip)"],
          ["Search no results", "Magnifying glass illustration", "No Results Found", "Try different keywords or check the spelling of the country name.", "Clear Search (text button)"],
          ["Offline — no cache", "Cloud with X illustration", "You're Offline", "Connect to the internet to access your visa applications and AI features.", "Retry Connection (outlined button)"],
        ],
        [1600, 1600, 2000, 2400, 1760]
      ),

      spacer(1),
      h2("7.5 Dialog & Bottom Sheet System"),
      simpleTable(
        ["Component", "Trigger", "Dismissible", "Content", "Max Height"],
        [
          ["Confirmation dialog", "Destructive actions (delete, discard)", "Backdrop only (web), swipe (mobile)", "Title + body + Cancel + Confirm (destructive)", "Fixed (~280dp)"],
          ["Info dialog", "Help icons, 'Learn more' actions", "Backdrop + X button", "Title + rich text content + OK", "Auto (~360dp)"],
          ["Bottom sheet (persistent)", "Document details, filter drawer", "Swipe down, tap backdrop", "Full document view with actions", "70% screen height"],
          ["Bottom sheet (modal)", "Action pickers, type selectors", "Swipe down, tap backdrop", "Icon + label list options", "Auto, max 60%"],
          ["Full-screen modal", "Audit report view, PDF preview", "X button only (no dismiss behind)", "Full content view", "100% screen"],
          ["Alert dialog", "Permission requests, critical warnings", "Confirm button only (no dismiss)", "Critical message + single confirm action", "Fixed (~240dp)"],
        ],
        [2200, 1800, 1800, 2200, 1360]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 08 — NAVIGATION ARCHITECTURE
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("08", "Navigation Architecture", "Mobile & Web Navigation Patterns per User Role"),
      spacer(1),

      h2("8.1 Mobile Navigation — Bottom Navigation Bar"),
      para("Used for: Consumer (Tourist & Professional) users on Android/iOS. Maximum 5 items (MD3 standard). Active state: filled icon + label + indicator pill."),
      simpleTable(
        ["Position", "Label", "Icon (inactive)", "Icon (active)", "Badge"],
        [
          ["1 — Home", "Home", "home_outlined", "home_filled", "—"],
          ["2 — Applications", "Applications", "folder_open", "folder_filled", "Count of in-progress apps"],
          ["3 — Documents", "Documents", "description_outlined", "description_filled", "Count of docs needing attention"],
          ["4 — Chat", "AI Assistant", "chat_bubble_outline", "chat_bubble_filled", "Count of unread messages"],
          ["5 — Profile", "Profile", "person_outline", "person_filled", "Red dot if action needed (e.g. complete profile)"],
        ],
        [1200, 1400, 2000, 2000, 2760]
      ),

      spacer(1),
      h2("8.2 B2B HR Manager — Bottom Navigation"),
      simpleTable(
        ["Position", "Label", "Icon", "Description"],
        [
          ["1 — Dashboard", "Dashboard", "dashboard", "Team visa overview, stats"],
          ["2 — Team", "Team", "group", "Employee list with visa status"],
          ["3 — Bulk Upload", "Bulk Upload", "upload_file", "Multi-person document upload"],
          ["4 — Reports", "Reports", "bar_chart", "Compliance reports, analytics"],
          ["5 — Settings", "Settings", "settings", "Company profile, user management"],
        ],
        [1200, 1400, 1400, 5360]
      ),

      spacer(1),
      h2("8.3 Admin Panel — Navigation Drawer (Mobile) / Rail (Tablet)"),
      simpleTable(
        ["Section", "Nav Item", "Icon", "Sub-items"],
        [
          ["Overview", "Dashboard", "dashboard", "—"],
          ["User Management", "Users", "group", "All Users, Pending Verification, Blocked"],
          ["Applications", "Applications", "assignment", "All Applications, Flagged, Pending Review"],
          ["AI Monitoring", "AI Logs", "psychology", "Audit Logs, Requirements Cache, Chat Logs"],
          ["Content", "Requirements DB", "library_books", "Countries, Visa Types, Source URLs"],
          ["Finance", "Revenue", "payments", "Subscriptions, Transactions, Refunds"],
          ["System", "Settings", "admin_panel_settings", "API Keys, Feature Flags, Notifications"],
          ["System", "Audit Log", "receipt_long", "All admin actions with timestamps"],
        ],
        [1400, 1600, 1400, 4960]
      ),

      spacer(1),
      h2("8.4 Web Navigation — Sidebar + Top Bar"),
      frameBox("Web Layout Structure — Persistent Sidebar", [
        h4("TOP APP BAR"),
        para("Height: 64px | Background: white + border-bottom 1px slate-200"),
        para("Left: VisaIQ logo wordmark | Center: Global search bar (full-width on desktop, icon-only on mobile) | Right: Notification bell (with badge) + Avatar dropdown"),
        spacer(1),
        h4("LEFT SIDEBAR (Desktop ≥1024px)"),
        para("Width: 240px | Background: white | Border-right: 1px slate-200 | Overflow-y: auto"),
        para("Top: User avatar + name + role badge | Sections: Nav items grouped with section labels | Bottom: fixed — Help, Settings, Logout"),
        para("Active item: royal-50 background, royal-600 text, 3px left accent border"),
        spacer(1),
        h4("COLLAPSED SIDEBAR (768px–1023px)"),
        para("Width: 72px (icons only) | Hover tooltip shows label | Same active indicator (icon turns royal-600)"),
        spacer(1),
        h4("MOBILE WEB (<768px)"),
        para("Hamburger menu triggers bottom drawer overlay | Same items as sidebar | Closes on item tap or backdrop tap"),
      ]),

      spacer(1),
      h2("8.5 Navigation Flows & Deep Linking"),
      simpleTable(
        ["Deep Link Path", "Screen", "Auth Required"],
        [
          ["/", "Dashboard (post-login) or Landing (pre-login)", "—"],
          ["/auth/login", "Login screen", "No"],
          ["/auth/register", "Registration screen", "No"],
          ["/onboarding", "Onboarding wizard step 1", "Yes"],
          ["/applications", "Applications list", "Yes"],
          ["/applications/new", "New application wizard", "Yes"],
          ["/applications/:id", "Application detail", "Yes"],
          ["/applications/:id/documents", "Document management", "Yes"],
          ["/applications/:id/audit/:docId", "Individual document audit report", "Yes"],
          ["/applications/:id/requirements", "Live requirements screen", "Yes"],
          ["/chat", "AI chat assistant", "Yes"],
          ["/chat/:applicationId", "Context-aware chat for specific application", "Yes"],
          ["/reports/:reportId", "Shared audit report (via token)", "Token-based"],
          ["/booking", "VIP consultation booking", "Yes"],
          ["/admin", "Admin dashboard", "Admin role"],
          ["/admin/users/:uid", "User detail (admin)", "Admin role"],
        ],
        [3600, 3200, 2560]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 09 — USER TYPES & ROLE-BASED UX
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("09", "User Types & Role-Based UX", "Tourist · Professional · HR Manager · Admin"),
      spacer(1),

      h2("9.1 User Type Matrix"),
      simpleTable(
        ["User Type", "Role Code", "Primary Goal", "Key Screens", "Premium Features"],
        [
          ["Tourist / First-Timer", "CONSUMER_FREE", "Get visa approved on first try", "Onboarding, Requirements, Document Upload, Chat", "Audit (1 free), PDF report"],
          ["Professional Traveler", "CONSUMER_PRO", "Speed + accuracy, minimal friction", "Dashboard, Quick Upload, Advanced Chat", "Unlimited audits, Priority support"],
          ["HR Manager", "B2B_MANAGER", "Process team visas efficiently", "Team Dashboard, Bulk Upload, Reports", "All Pro features + team management"],
          ["Company Employee", "B2B_MEMBER", "Submit own documents under HR", "Limited Dashboard, Document Upload", "Audits managed by HR account"],
          ["VIP Client", "CONSUMER_VIP", "Expert-guided application", "All screens + direct expert contact", "VIP booking, White-glove service"],
          ["Platform Admin", "ADMIN", "Monitor platform health, manage users", "Admin dashboard, AI logs, User management", "All features + admin controls"],
          ["Super Admin", "SUPER_ADMIN", "System configuration, escalations", "All admin features + system settings", "Feature flags, API key management"],
        ],
        [1600, 1800, 2200, 2000, 1760]
      ),

      spacer(1),
      h2("9.2 Feature Access by Role"),
      simpleTable(
        ["Feature", "Consumer Free", "Consumer Pro", "B2B Manager", "B2B Member", "Admin"],
        [
          ["Applications (create)", "3 max", "Unlimited", "Unlimited (team)", "As assigned", "Read + manage"],
          ["Document Upload", "Yes", "Yes", "Bulk + individual", "Yes", "View only"],
          ["AI Audit", "1 per doc", "Unlimited", "Unlimited", "Unlimited", "View logs"],
          ["Requirements Search", "3/day", "Unlimited", "Unlimited", "Unlimited", "Manage cache"],
          ["AI Chat", "20 msgs/day", "Unlimited", "Unlimited", "Unlimited", "Monitor logs"],
          ["PDF Export", "Watermarked", "Full quality", "Full + branded", "Full quality", "N/A"],
          ["VIP Booking", "Purchase only", "Included", "Team booking", "Via HR", "Manage"],
          ["Team Management", "No", "No", "Yes (full)", "No (member)", "Full access"],
          ["Analytics", "Basic", "Advanced", "Team + export", "Own data", "Platform-wide"],
          ["Offline Mode", "Read-only", "Full cache", "Full cache", "Full cache", "No"],
          ["API Access", "No", "No", "Yes (beta)", "No", "Full"],
        ],
        [2400, 1400, 1400, 1500, 1500, 1160]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 10 — ONBOARDING & AUTH FRAMES
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("10", "Frame-by-Frame: Onboarding & Authentication", "Splash → Welcome → Auth → Onboarding Wizard"),
      spacer(1),

      h2("10.1 FRAME: Splash Screen (F-SPLASH-01)"),
      simpleTable(
        ["Element", "Specification"],
        [
          ["Background", "color.background.brand (navy-900) — full screen"],
          ["Logo position", "Centered vertically, 40% from top"],
          ["Logo", "VisaIQ wordmark: 'VISA' white (Plus Jakarta Sans, 48sp, Bold) + 'IQ' teal (same)"],
          ["Tagline", "'AI-Powered Visa Intelligence' — Inter, 16sp, slate-400, centered"],
          ["Loading indicator", "Linear progress bar (2dp) at bottom of screen — royal-600 on navy-800"],
          ["Animation", "Logo fades in (500ms, ease-out) → tagline slides up (300ms, 200ms delay) → progress bar fills"],
          ["Duration", "Minimum 1.5s, maximum 3s (wait for auth check + initial data)"],
          ["Exit", "Fade transition to Welcome (unauthenticated) or Dashboard (authenticated)"],
        ],
        [2000, 7360]
      ),

      spacer(1),
      h2("10.2 FRAME: Welcome Screen (F-WELCOME-01)"),
      frameBox("Welcome Screen Layout — Unauthenticated User", [
        h4("HERO SECTION (top 55% of screen)"),
        para("Background: gradient from navy-900 (top) to royal-600 (bottom) | Illustration: passport + airplane + map pin vector graphic, 200dp max height"),
        para("Title: 'Visa Applications, Simplified' — Plus Jakarta Sans, 32sp, Bold, white"),
        para("Subtitle: 'AI-powered guidance from checklist to approval. Know exactly what you need, before you apply.' — Inter, 16sp, slate-200, center, line-height 1.5"),
        spacer(1),
        h4("TRUST INDICATORS ROW (3 items, horizontal)"),
        para("Each: Icon (24dp, teal) + Label text (Inter, 12sp, white)"),
        para("Icons + Labels: shield_check 'GDPR Compliant' | auto_awesome '94% Accuracy' | support_agent 'Expert Support'"),
        spacer(1),
        h4("ACTION SECTION (bottom 45% of screen)"),
        para("Background: white, border-radius-top 24dp | Padding: 32dp"),
        para("Button 1: 'Continue with Google' — Outlined, 52dp, Google logo (16dp) + text, full width"),
        para("Button 2: 'Sign Up with Email' — Filled (royal-600), 52dp, email icon, full width"),
        para("Divider: '— or —' centered between buttons"),
        para("Button 3: 'I already have an account' — Text button, center, royal-600 text"),
        para("Footer: 'By continuing, you agree to our Terms & Privacy Policy' — body.small, slate-400"),
      ]),

      spacer(1),
      h2("10.3 FRAME: Email Registration (F-AUTH-REG-01)"),
      simpleTable(
        ["Element", "Specification"],
        [
          ["Screen header", "Back arrow (left) + 'Create Account' title (center) + 'Sign In' text link (right)"],
          ["Progress indicator", "Step 1 of 2: 'Account Details' (active) → 'Verify Email'"],
          ["Full name field", "Input, required, max 60 chars, auto-capitalize words"],
          ["Email field", "Input, type email, required, real-time format validation"],
          ["Password field", "Input, type password, toggle visibility icon, min 8 chars, strength indicator"],
          ["Password strength", "4-segment bar below field: Weak (red) → Fair (orange) → Good (yellow) → Strong (green)"],
          ["Confirm password", "Input, type password, validates match on blur"],
          ["CTA button", "'Create Account' — Filled, full width, disabled until all valid"],
          ["Social alternative", "'Or sign up faster with Google' → Google OAuth button"],
          ["Legal", "Checkbox: 'I agree to Terms of Service and Privacy Policy' — required before enable CTA"],
        ],
        [2400, 6960]
      ),

      spacer(1),
      h2("10.4 FRAME: Email Verification (F-AUTH-VERIFY-01)"),
      frameBox("Email Verification Screen", [
        h4("LAYOUT"),
        para("Illustration: envelope with checkmark — centered, 120dp"),
        para("Title: 'Check Your Email' — display.medium, navy"),
        para("Body: 'We sent a verification link to john@email.com. Check your inbox and tap the link to activate your account.' — body.large, slate-600"),
        para("CTA: 'Open Email App' — filled button | 'Resend Email' — text button (disabled for 60s countdown)"),
        para("Countdown: 'Resend available in 0:42' — body.small, slate-400"),
        para("Fallback: 'Didn't receive it? Check spam or use a different email.' — body.small, slate-400"),
      ]),

      spacer(1),
      h2("10.5 FRAME: Login Screen (F-AUTH-LOGIN-01)"),
      simpleTable(
        ["Element", "Specification"],
        [
          ["Header", "VisaIQ logo (centered, 32dp) + 'Welcome Back' title"],
          ["Email field", "Input, pre-filled if remembered, type email"],
          ["Password field", "Input, type password, toggle visibility, 'Forgot password?' text link (right-aligned)"],
          ["Biometric prompt (mobile)", "Shows if previously used: 'Sign in with Face ID / Fingerprint' with biometric icon"],
          ["Login CTA", "'Sign In' — Filled, full width, loading state during auth"],
          ["Error state", "Toast: 'Invalid email or password. Try again.' (after failed attempt) | After 5 failures: 'Account temporarily locked. Reset your password.'"],
          ["Social login", "'Or continue with Google' — outlined button"],
          ["Register link", "'New to VisaIQ? Create an Account' — text button, bottom center"],
        ],
        [2400, 6960]
      ),

      spacer(1),
      h2("10.6 ONBOARDING WIZARD — 4 Steps (F-ONBOARD-01 to 04)"),
      para("Wizard shown once after registration. Can be revisited in Profile Settings. Data pre-fills all application forms."),
      spacer(1),
      simpleTable(
        ["Step", "Frame ID", "Title", "Fields", "Validation"],
        [
          ["1/4 — Nationality", "F-ONBOARD-01", "Where Are You From?", "Country of citizenship (country picker, searchable) | Passport number (optional, monospace) | Passport expiry date (date picker)", "Country required | Passport format if provided"],
          ["2/4 — Destination", "F-ONBOARD-02", "Where Are You Headed?", "Destination country (country picker) | Visa type (bottom sheet selector with icons: Tourist, Business, Work, Study, Transit) | Travel purpose (chip selector: Holiday, Work, Conference, Family Visit, Study)", "Country + visa type required"],
          ["3/4 — Your Profile", "F-ONBOARD-03", "Tell Us About You", "Occupation category (chip selector: Employed, Self-Employed, Student, Retired) | Annual income bracket (optional, dropdown) | Previous visa rejections (toggle switch — if YES: country + reason)", "Occupation required"],
          ["4/4 — Ready!", "F-ONBOARD-04", "You're All Set!", "Summary card showing: flag + destination, visa type, AI readiness score preview | 'Start Document Upload' CTA | 'Skip for now' text link", "No validation — confirmation only"],
        ],
        [1600, 1600, 1800, 2800, 1560]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 11 — TOURIST / CONSUMER USER FRAMES
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("11", "Frame-by-Frame: Tourist / Consumer User", "Full Journey from Dashboard to Submission Ready"),
      spacer(1),

      h2("11.1 FRAME: Consumer Dashboard (F-DASH-CON-01)"),
      frameBox("Consumer Dashboard Layout", [
        h4("APP BAR (52dp)"),
        para("Left: Menu / Avatar (32dp circle, initials) | Center: 'VisaIQ' wordmark | Right: notification_bell (badge if unread) + search_icon"),
        spacer(1),
        h4("GREETING BANNER"),
        para("Height: 80dp | Background: gradient navy-to-royal | Content: 'Good morning, Sarah' (display.small, white) + 'Schengen visa in 12 days' (body.medium, teal) + calendar icon"),
        spacer(1),
        h4("READINESS SCORE CARD"),
        para("Full width, elevated card, elevation.3 | Large circular score ring (80dp diameter) showing overall application readiness score"),
        para("Score zones: 0-49: 'Needs Work' (red), 50-74: 'Almost Ready' (orange), 75-89: 'Nearly Ready' (yellow), 90-100: 'Ready to Apply' (green)"),
        para("Below ring: 3 mini-metric chips: 'Docs: 4/6 uploaded' | 'Audit: 2 issues' | 'Requirements: Updated 2h ago'"),
        para("CTA: 'Complete Checklist' or 'Apply Now' depending on score"),
        spacer(1),
        h4("ACTIVE APPLICATIONS (horizontal scroll cards)"),
        para("Card width: 280dp | Height: 120dp | Content: flag emoji + country name (headline.medium) + visa type + status chip + progress bar (% documents uploaded)"),
        spacer(1),
        h4("QUICK ACTIONS GRID (2x2)"),
        para("Cards: 'Upload Document' (upload_file, royal) | 'Check Requirements' (travel_explore, teal) | 'Ask AI Assistant' (auto_awesome, purple) | 'Book Expert' (calendar_today, gold)"),
        spacer(1),
        h4("RECENT ACTIVITY FEED"),
        para("List of recent actions: AI audit completed, document uploaded, requirements updated, chat message"),
        para("Each item: icon + action description + relative timestamp | Max 5 items + 'View all activity' link"),
      ]),

      spacer(1),
      h2("11.2 FRAME: New Application Wizard (F-APP-NEW-01 to 05)"),
      simpleTable(
        ["Step", "Title", "Key UI Elements", "Interactions"],
        [
          ["1 — Trip Details", "Where Are You Going?", "Destination country picker (flag + name) | Departure date + return date (date range picker) | Purpose chips (Holiday, Business, Conference, etc.)", "Date picker: calendar bottom sheet | Purpose: multi-select chips | Validation: return must be after departure"],
          ["2 — Visa Selection", "Choose Your Visa Type", "Visa type cards (icon + name + brief description + fee estimate) in scrollable grid | 'Not sure? Let AI recommend' text link", "Tap card to select | AI recommendation: shows 3 options with confidence %"],
          ["3 — Application Details", "About This Trip", "Hotel/accommodation field | Sponsor/host info (optional toggle) | Previous visits to same country (toggle + number if yes) | Consulate/embassy selector", "Conditional show/hide for sponsor fields | Consulate list filtered by nationality+destination"],
          ["4 — Document Checklist", "Documents Needed", "Auto-generated checklist from requirements AI | Each item: doc name + priority (Required/Recommended) + upload button + status chip", "Upload triggers direct document upload flow | Status: Not uploaded / Uploaded / Audit passed"],
          ["5 — Confirm & Save", "Your Application Summary", "Summary of all fields in review cards | Edit buttons per section | 'Save Application' CTA | Estimated processing timeline", "Edit: navigate back to specific step | Save: creates Firestore record, returns to dashboard"],
        ],
        [1200, 1800, 3000, 3360]
      ),

      spacer(1),
      h2("11.3 FRAME: Application Detail (F-APP-DETAIL-01)"),
      frameBox("Application Detail Screen Layout", [
        h4("HEADER BAR"),
        para("Back arrow | App name (e.g. 'France — Schengen Tourist') | Edit icon (trailing)"),
        spacer(1),
        h4("STATUS BANNER"),
        para("Full-width colored banner per status | Contains: status icon + status label + last updated timestamp"),
        spacer(1),
        h4("READINESS SCORE SECTION"),
        para("Circular score ring (60dp) + score label + breakdown progress bars: Documents (4/6), Audit (passed 3, issues 1), Requirements (complete)"),
        spacer(1),
        h4("TAB BAR (sticky below score section)"),
        para("4 tabs: Overview | Documents | Requirements | Chat"),
        spacer(1),
        h4("OVERVIEW TAB"),
        para("Trip details card: dates, visa type, consulate | Timeline card: today → submission → decision → travel | Action checklist: prioritized next steps"),
        spacer(1),
        h4("DOCUMENTS TAB"),
        para("Upload zone (compact) | Document grid: 2 columns (phone), 3 columns (tablet) | Each card: thumbnail + name + status chip + audit score ring + menu (View, Re-upload, Delete)"),
        spacer(1),
        h4("REQUIREMENTS TAB"),
        para("AI freshness banner (how old is cached data) | Structured requirements list with sections: Required Documents, Financial Requirements, Processing Info | Source citations for each section"),
        spacer(1),
        h4("CHAT TAB"),
        para("Context-aware AI chat showing application context at top | Conversation thread | Suggested questions chips (3 visible) | Input field + send button"),
      ]),

      spacer(1),
      h2("11.4 FRAME: Document Upload (F-DOC-UPLOAD-01)"),
      simpleTable(
        ["Phase", "Screen State", "Key Elements"],
        [
          ["Empty state", "Pre-upload", "Upload zone (full-width dashed) | 'Tap to choose file' or 'Take photo' (mobile) | Supported formats label | Recent uploads (if any)"],
          ["File selection", "File picker open", "Native file picker (web) | Camera/Files bottom sheet (mobile): 'Take Photo' + 'Choose from Gallery' + 'Browse Files' options"],
          ["Uploading", "Progress state", "Upload progress bar (linear, 0-100%) | File name + size | Cancel button | Animated upload cloud icon"],
          ["Processing", "AI audit running", "Document card with animated pulsing border (purple) | Phase labels rotating: 'Analyzing...' → 'Checking expiry...' → 'Verifying format...' | Cannot be cancelled at this stage"],
          ["Audit complete", "Results available", "Score ring (color by score) on card | 'View Audit Report' prominent button | Issues count chip | 'Upload Another' text link"],
          ["Audit failed", "Error state", "Red border card | Error message | 'Retry Audit' button | 'Contact Support' link"],
        ],
        [1600, 1800, 5960]
      ),

      spacer(1),
      h2("11.5 FRAME: Audit Report Detail (F-AUDIT-REPORT-01)"),
      frameBox("Audit Report Screen — Full Specification", [
        h4("REPORT HEADER"),
        para("Document thumbnail (if image) or file type icon (if PDF) — 80dp | Document type label + filename | Score ring (80dp) with percentage centered"),
        para("Passed/Failed/Attention banner bar | Report generated timestamp | Download PDF button + Share button (trailing)"),
        spacer(1),
        h4("FINDINGS SECTION"),
        para("Title: 'Audit Findings' + count badge"),
        para("Each finding card: severity icon (error_outline/warning/check_circle) + finding title + description + recommendation + AI confidence score (small badge)"),
        para("Finding categories: CRITICAL (red) | WARNING (orange) | INFO (blue) | PASS (green)"),
        spacer(1),
        h4("DOCUMENT CHECKS ACCORDION"),
        para("'Validity Check' — expiry date extracted + days until expiry + pass/fail"),
        para("'Name Consistency' — name on doc vs profile name + match confidence %"),
        para("'Format & Completeness' — required fields present check"),
        para("'Financial Indicators' — for bank statements: balance trend, average balance, flagged transactions"),
        spacer(1),
        h4("RECOMMENDATIONS"),
        para("Bulleted list of prioritized actions to fix issues | AI disclaimer: 'Generated by Claude AI. Review with official sources.'"),
        spacer(1),
        h4("ACTIONS BAR (bottom)"),
        para("'Re-upload Document' (if critical issues) | 'Accept & Continue' (if minor issues) | 'Download PDF Report'"),
      ]),

      spacer(1),
      h2("11.6 FRAME: Live Requirements Screen (F-REQ-01)"),
      simpleTable(
        ["Section", "Content", "Design Notes"],
        [
          ["Search bar (sticky)", "Nationality + destination + visa type (pre-filled from application) + 'Update Search' button", "Always visible — allows quick re-search"],
          ["Freshness indicator", "Data freshness banner: 'Updated X hours ago — Sources verified' or 'Data is 20+ hours old — Verify before submitting'", "Green if <6hrs, orange if 6-24hrs, red if >24hrs"],
          ["Processing time card", "Estimated processing: X–Y business days | Rush processing: available/unavailable | Seasonal note if applicable", "Prominent card, top of results"],
          ["Fee card", "Application fee: currency + amount | Service fee (if via agency) | Payment methods accepted", "Tappable — links to official embassy fee page"],
          ["Required documents list", "Numbered list with document name + description + notes | Each item maps to uploaded docs with status indicator", "Tap item: detail bottom sheet with full description"],
          ["Financial requirements", "Minimum bank balance + per-day allowance + proof type required", "Highlighted if user's uploaded bank statement may not meet threshold"],
          ["Source citations", "Each section has 'Source: [Embassy Website Name]' with open_in_new icon", "Tapping opens browser to official source URL"],
          ["AI disclaimer footer", "Fixed footer: 'AI-generated guidance. Verify with official embassy before submitting.'", "Never hidden, always readable"],
        ],
        [2000, 3600, 3760]
      ),

      spacer(1),
      h2("11.7 FRAME: AI Chat (F-CHAT-01)"),
      frameBox("AI Chat Screen — Full Interactive Specification", [
        h4("CHAT APP BAR"),
        para("Left: Back arrow | Center: 'VisaIQ Assistant' + AI badge (purple) | Right: info_outline icon (shows disclaimer dialog) + more_vert menu (Clear chat, Report issue)"),
        spacer(1),
        h4("CONTEXT CHIP BAR (sticky below app bar)"),
        para("Shows active application context: Flag + 'France — Schengen' chip (tapable to change) | 'Docs: 4/6' chip | 'Audit: Issues found' chip (red if issues)"),
        spacer(1),
        h4("CONVERSATION AREA"),
        para("User messages: right-aligned, royal-600 background, white text, border-radius: 16dp top-left, 4dp bottom-right"),
        para("AI messages: left-aligned, white background, elevation.1, border-radius: 4dp top-left, 16dp bottom-right"),
        para("AI messages: include small AI badge (purple, 'AI' label) at top-left of bubble"),
        para("Timestamp: below each message group, slate-400, label.small"),
        para("Long messages: full text visible (no truncation) — scroll to read"),
        spacer(1),
        h4("SUGGESTED ACTIONS CHIPS (after AI response)"),
        para("Horizontal scroll row of assist chips: 'What documents do I need?' | 'Explain this requirement' | 'Is my passport valid?' | 'Book expert help'"),
        spacer(1),
        h4("TYPING INDICATOR"),
        para("Three animated dots (royal-600, 8dp diameter each) in a left-aligned bubble — bouncing animation, 300ms per dot offset by 100ms"),
        spacer(1),
        h4("DISCLAIMER BANNER (fixed, above input)"),
        para("Height: 32dp | Background: gold-50 | Text: 'AI guidance only — not legal advice. Always verify with official embassy.' — label.small, slate-600"),
        spacer(1),
        h4("INPUT BAR (bottom, above keyboard)"),
        para("Height: 52dp + safe area inset | Text field: multi-line, max 3 visible lines before scroll | Background: slate-100 | Radius: radius.xl"),
        para("Right: Send button (filled icon button, royal-600) — disabled when empty, enabled when text present"),
        para("Left: Attachment icon (if document sharing enabled in future) — slate-400"),
      ]),

      spacer(1),
      h2("11.8 FRAME: VIP Booking (F-BOOKING-01)"),
      simpleTable(
        ["Phase", "Frame", "Elements"],
        [
          ["Booking intro", "F-BOOKING-01", "VIP card (gold gradient) | Expert profile photo + name + credentials | Session types: 30min ($49) / 60min ($89) / Emergency ($149) | 'What's included' expandable list | 'Book Now' CTA"],
          ["Calendar selection", "F-BOOKING-02", "Calendly embed (WebView on mobile) or inline calendar (web) | Available time slots | Timezone selector | Confirmation summary"],
          ["Pre-call summary", "F-BOOKING-03", "Auto-generated: 'Your audit summary will be shared with the expert before your call' | Summary preview: application country, audit score, key issues | Consent toggle | 'Confirm Booking' CTA"],
          ["Booking confirmed", "F-BOOKING-04", "Confirmation animation (checkmark) | Meeting details card: date, time, expert name, video link | Add to calendar button | Reminder toggle (push notification) | 'Return to Dashboard' button"],
        ],
        [1600, 1600, 6160]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 12 — PROFESSIONAL B2C USER FRAMES
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("12", "Frame-by-Frame: Professional B2C User", "Power User — Speed, Accuracy & Advanced Features"),
      spacer(1),

      h2("12.1 Professional Dashboard (F-DASH-PRO-01)"),
      frameBox("Professional Dashboard — Differentiated Layout", [
        h4("KEY DIFFERENCES FROM CONSUMER DASHBOARD"),
        para("No beginner guidance copy — assumes familiarity with visa process"),
        para("More data density: Shows multiple applications in compact list view (not horizontal scroll cards)"),
        para("Advanced metrics: Overall audit pass rate %, average processing time, total applications submitted"),
        spacer(1),
        h4("QUICK STATS BAR (4 metrics, horizontal scroll)"),
        para("Active Applications | Docs Pending Audit | Next Travel Date | Avg. Audit Score"),
        spacer(1),
        h4("APPLICATIONS LIST VIEW"),
        para("Dense list: flag + destination | visa type + status chip | doc count | audit score | arrow"),
        para("Sort/filter bar: Status | Date | Country | Audit Score"),
        spacer(1),
        h4("PRIORITY ACTIONS"),
        para("Smart card highlighting most urgent action: 'Your France application needs 2 more documents — deadline in 8 days'"),
        spacer(1),
        h4("SPEED ACTIONS (FAB)"),
        para("Extended FAB: 'New Application' | On scroll: collapses to icon-only circular FAB"),
      ]),

      spacer(1),
      h2("12.2 Professional: Multi-Application Manager (F-PRO-APPS-01)"),
      simpleTable(
        ["Element", "Specification"],
        [
          ["View toggle", "List view (default) / Grid view — icon buttons top-right"],
          ["Search & filter bar", "Search by country/visa type | Status filter chips (all, active, draft, complete) | Sort: Date, Status, Score"],
          ["List item (expanded)", "Flag | Country + Visa Type | Status chip | Dates: Applied / Decision | Score ring (32dp) | Progress bar (docs %) | Quick actions: Chat, Docs, Requirements"],
          ["Batch actions", "Long-press to select multiple | Batch actions appear: Export PDFs, Archive, Delete"],
          ["Add new application", "Floating '+' button — direct to wizard step 1"],
          ["Application status timeline", "Inline mini-timeline per card showing key milestones"],
        ],
        [2400, 6960]
      ),

      spacer(1),
      h2("12.3 Professional: Advanced Document Management (F-PRO-DOCS-01)"),
      frameBox("Professional Document View — Enhanced Features", [
        h4("CROSS-APPLICATION DOCUMENTS LIBRARY"),
        para("All uploaded documents across all applications — no need to re-upload same passport for each application"),
        para("Categorized tabs: Passport | Bank Statements | Employment | Other"),
        spacer(1),
        h4("DOCUMENT COMPARISON TOOL"),
        para("Select 2 documents of same type to compare audit results side-by-side"),
        para("Shows: score diff, name consistency across both, date overlap issues"),
        spacer(1),
        h4("BULK UPLOAD (web only)"),
        para("Drag & drop zone accepting multiple files | AI auto-categorizes document types | Batch audit processing with queue progress"),
        spacer(1),
        h4("AUDIT HISTORY"),
        para("Per-document: audit timeline — all previous audits with scores and key findings | Trend chart: score improvement over re-uploads"),
      ]),

      spacer(1),
      h2("12.4 Professional: AI Chat — Advanced Mode (F-PRO-CHAT-01)"),
      simpleTable(
        ["Feature", "Pro vs Consumer"],
        [
          ["Message limit", "Unlimited (Pro) vs 20/day (Consumer)"],
          ["Context depth", "Can reference specific documents: '@Passport' '@BankStatement_Dec' — linked inline", ],
          ["Response format", "Toggle: Conversational (default) / Structured (bullet-point breakdown)"],
          ["Expert handoff", "One-tap 'Escalate to Expert' button appears on complex queries"],
          ["Audit integration", "Chat shows audit findings inline: 'Your passport (score: 67) has 2 issues — want me to explain?'"],
          ["Saved responses", "Bookmark AI responses for reference | Export chat as PDF"],
        ],
        [2400, 6960]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 13 — HR MANAGER B2B USER FRAMES
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("13", "Frame-by-Frame: HR Manager B2B User", "Team Management · Bulk Operations · Compliance Reporting"),
      spacer(1),

      h2("13.1 B2B Dashboard (F-DASH-B2B-01)"),
      frameBox("HR Manager Dashboard — Team Overview", [
        h4("TOP METRICS BAR"),
        para("4 KPI cards: Total Team Applications | Applications Ready to Submit | Documents Pending Action | Average Team Audit Score"),
        spacer(1),
        h4("TEAM STATUS TABLE"),
        para("Columns: Employee Name | Destination | Visa Type | Status (color chip) | Docs Submitted | Audit Score | Action Required | Last Updated"),
        para("Sort: any column | Filter: department, visa type, status | Search: employee name | Pagination or infinite scroll"),
        spacer(1),
        h4("BULK ACTIONS BAR (appears when rows selected)"),
        para("Actions: Send Reminder | Export PDF Reports | Move to Archive | Assign Reviewer"),
        spacer(1),
        h4("UPCOMING DEADLINES"),
        para("Timeline widget: next 30 days, color-coded by urgency | Each item: employee name + destination + days until submission deadline"),
        spacer(1),
        h4("QUICK STATS CHART"),
        para("Donut chart: application status distribution (submitted, in-progress, not-started)"),
        para("Bar chart: documents per application average | All charts use semantic color tokens"),
      ]),

      spacer(1),
      h2("13.2 B2B: Bulk Document Upload (F-B2B-BULK-01)"),
      simpleTable(
        ["Feature", "Specification"],
        [
          ["Upload method", "CSV template import (employee names + visa details) | Drag & drop multi-file | Manual assignment"],
          ["Employee mapping", "AI attempts to auto-match uploaded documents to employees by name | Manual correction if mismatch"],
          ["Batch audit queue", "Shows live queue: '12 documents processing — 4 complete, 3 in progress, 5 pending' | Estimated total time"],
          ["Progress table", "Employee | Document | Status | Score (live updating) | Issues | Action"],
          ["Conflict resolution", "When AI cannot confidently assign document to employee — manual assignment modal with side-by-side"],
          ["Completion summary", "All processed: X passed, Y issues, Z critical — export batch report PDF | Notify employees toggle"],
        ],
        [2000, 7360]
      ),

      spacer(1),
      h2("13.3 B2B: Employee Management (F-B2B-TEAM-01)"),
      simpleTable(
        ["Screen", "Elements"],
        [
          ["Team list", "Employee cards: avatar + name + role + department + active applications count + status | Add Employee button | Import CSV button"],
          ["Employee detail", "Profile: name, passport, nationality | Active applications list | Document library | Audit history | Notes field (HR-only)"],
          ["Invite employee", "Email invite with pre-configured visa type | Employee receives invite to create account under HR dashboard"],
          ["Access management", "Toggle: employee can view own audit results | Toggle: employee can chat with AI | Reset password link"],
          ["Remove employee", "Confirmation dialog | Options: Archive data (GDPR compliant) or Delete all data | Confirmation email to employee"],
        ],
        [2400, 6960]
      ),

      spacer(1),
      h2("13.4 B2B: Compliance & Reports (F-B2B-REPORTS-01)"),
      frameBox("Compliance Reporting Dashboard", [
        h4("REPORT TYPES"),
        para("Team Compliance Report: all employees, visa statuses, document completeness | Export: PDF, CSV"),
        para("Audit Summary Report: aggregate audit scores, common issues, improvement areas | Export: PDF, CSV"),
        para("Timeline Report: applications by month, approval rates, average processing time"),
        spacer(1),
        h4("CUSTOM REPORT BUILDER"),
        para("Select employees (all or subset) | Select date range | Select data points (audit scores, statuses, docs) | Generate PDF"),
        spacer(1),
        h4("SCHEDULED REPORTS"),
        para("Set weekly/monthly report auto-generation | Email delivery list | Last 3 report previews in list"),
        spacer(1),
        h4("DATA EXPORT"),
        para("Raw data CSV export | GDPR data request export | Audit log export (admin-level only)"),
      ]),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 14 — ADMIN USER FRAMES
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("14", "Frame-by-Frame: Admin User", "Platform Monitoring · User Management · AI Oversight"),
      spacer(1),

      h2("14.1 Admin Dashboard (F-ADMIN-DASH-01)"),
      simpleTable(
        ["Section", "Content"],
        [
          ["Platform KPIs (top row)", "Total Users | Daily Active Users | Applications Today | AI Audits Today | Revenue Today — all with trend vs yesterday"],
          ["User growth chart", "Line chart: daily signups for last 30 days — split by consumer / B2B | Annotations: marketing events"],
          ["AI performance metrics", "Audit accuracy rate | Average audit processing time | Failed audit % | Search success rate | Chat volume"],
          ["System health", "API response time (P50/P95) | Error rate | Queue depth | Storage usage | Firebase reads/writes"],
          ["Recent flagged items", "List: Flagged documents (low confidence) | Reported chat messages | Failed payments | Appeals"],
          ["Quick actions", "Process refund | Unlock account | Clear requirements cache | Broadcast notification"],
        ],
        [2400, 6960]
      ),

      spacer(1),
      h2("14.2 Admin: User Management (F-ADMIN-USERS-01)"),
      simpleTable(
        ["Feature", "Specification"],
        [
          ["User list", "Table: UID | Name | Email | Plan | Signup date | Last active | Status | Actions"],
          ["Search & filter", "Search by name/email/UID | Filter by plan, status, signup date, country"],
          ["User detail view", "All profile data | Applications list | Documents (audit scores) | Chat history | Payment history | Admin notes"],
          ["Account actions", "Suspend/Reactivate | Force password reset | Upgrade/Downgrade plan | Delete account (GDPR) | Impersonate (super admin only)"],
          ["GDPR tools", "Export user data (JSON) | Delete user data | Mark as deleted | Data retention status"],
          ["Bulk actions", "Export CSV | Send email | Apply plan change | Suspend accounts"],
        ],
        [2000, 7360]
      ),

      spacer(1),
      h2("14.3 Admin: AI Monitoring (F-ADMIN-AI-01)"),
      frameBox("AI Oversight Dashboard", [
        h4("AUDIT MONITORING"),
        para("List of recent audits: user UID | document type | score | AI model used | processing time | confidence | any human review flags"),
        para("Low-confidence audits queue (score < 50 or flag): admin can manually review and override"),
        spacer(1),
        h4("REQUIREMENTS CACHE MANAGER"),
        para("Table: Country pair | Visa type | Cache age | Source URLs | Last refresh | Manual refresh button"),
        para("Stale detection: highlights entries older than 20 hours"),
        para("Override tool: admin can manually update requirements for a specific country/visa pair"),
        spacer(1),
        h4("CHAT LOG MONITORING"),
        para("Sample of AI chat conversations (anonymized) | Reported messages | AI disclaimer compliance check"),
        para("Prompt injection detection logs | Fallback rate (escalations to expert)"),
        spacer(1),
        h4("MODEL PERFORMANCE"),
        para("Per-model metrics: Claude (doc audit) — accuracy trend | Gemini (requirements + chat) — accuracy trend"),
        para("API error rates | Token usage | Cost per audit / per chat message"),
      ]),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 15 — AI INTERACTION DESIGN PATTERNS
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("15", "AI Interaction Design Patterns", "Trust, Transparency & AI UX Guidelines"),
      spacer(1),

      h2("15.1 AI Content Identification"),
      para("Every piece of AI-generated content in VisaIQ must be clearly identifiable to maintain user trust and legal compliance."),
      simpleTable(
        ["Context", "Identification Method", "Visual Treatment"],
        [
          ["Chat responses", "AI badge on message bubble", "Small purple chip 'AI' with auto_awesome icon — top-left of bubble"],
          ["Audit results", "'AI Audit Report' heading + model attribution", "'Analysis by Claude AI' — label.small, slate-400, italics"],
          ["Requirements", "'AI-gathered from official sources' + source list", "Source citation chip per section — teal, link underline"],
          ["Recommendations", "Recommendation card with AI indicator", "Purple left border + AI badge in card header"],
          ["Confidence scores", "Numeric % with visual bar", "Color-coded: green 90%+ / yellow 70-89% / orange 50-69% / red <50%"],
          ["All AI output", "Disclaimer footer", "Fixed small text: 'AI-generated guidance. Not legal advice. Verify with official sources.'"],
        ],
        [2000, 2400, 4960]
      ),

      spacer(1),
      h2("15.2 AI Error & Fallback States"),
      simpleTable(
        ["Failure Mode", "User-Facing Message", "UI Treatment", "Recovery Action"],
        [
          ["AI audit timeout (>30s)", "'The AI audit is taking longer than expected. We'll notify you when it's ready.'", "Toast + document card shows 'Processing' chip", "Background processing + push notification on complete"],
          ["Audit confidence too low", "'We couldn't confidently audit this document. Please ensure the image is clear and complete.'", "Red document card + specific guidance", "Re-upload with photo tips modal"],
          ["Requirements search failed", "'Could not retrieve live requirements. Showing last cached data from X hours ago.'", "Orange alert banner + stale indicator", "Manual retry button + contact support link"],
          ["Chat model unavailable", "'AI assistant is temporarily unavailable. Please try again in a few minutes.'", "Gray input bar, system message in chat", "Auto-retry after 30s + book expert CTA"],
          ["Hallucination guard triggered", "Response not shown — internal flag only", "Chat shows: 'This question requires expert verification. Book a VIP consultation.'", "VIP booking deeplink"],
          ["Network error during upload", "'Upload failed. Check your connection and try again.'", "Red upload zone, error toast", "Retry button on document card"],
        ],
        [2200, 2400, 2400, 2360]
      ),

      spacer(1),
      h2("15.3 Progressive Disclosure for Complex AI Output"),
      frameBox("AI Audit Results — Layered Disclosure Pattern", [
        h4("LAYER 1: Immediate Summary (always visible)"),
        para("Score ring (large, colored) + Pass/Fail/Attention label + count of issues"),
        para("User sees this within 1 second of audit completing"),
        spacer(1),
        h4("LAYER 2: Top Issues (expanded on tap)"),
        para("Top 3 issues with severity + one-line description each"),
        para("'Tap to see full audit details' expand trigger"),
        spacer(1),
        h4("LAYER 3: Full Report (on demand)"),
        para("All findings, detailed recommendations, document section breakdown"),
        para("Accessible via 'View Full Report' button — opens detail screen"),
        spacer(1),
        h4("LAYER 4: Raw Audit Data (expert mode)"),
        para("Available for admin and VIP users: full AI response JSON structure"),
        para("Hidden by default — toggle in settings"),
      ]),

      spacer(1),
      h2("15.4 AI Disclaimer Architecture"),
      simpleTable(
        ["Disclaimer Type", "Frequency", "Placement", "Dismissible"],
        [
          ["Chat disclaimer", "Every AI response", "Fixed banner above input field", "No"],
          ["Audit report disclaimer", "Every audit report", "Bottom of report before download", "No"],
          ["Requirements disclaimer", "Every requirements view", "Fixed footer + inline source citations", "No"],
          ["Onboarding consent", "Once — on account creation", "Full-screen acknowledgment screen with checkbox", "Yes (required to proceed)"],
          ["Legal advice boundary", "When complex legal question detected in chat", "Inline message before AI response", "No — always shown"],
          ["Confidence caveat", "When confidence < 70%", "Inline in recommendation card", "No"],
        ],
        [2400, 1600, 2400, 2960]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 16 — DOCUMENT AUDIT UX
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("16", "Document Audit UX & Prototype Flow", "Complete Audit Journey — Upload to Report"),
      spacer(1),

      h2("16.1 Complete Audit Flow Prototype"),
      para("The following frame-by-frame specification covers the full document audit journey with all interaction states:"),
      simpleTable(
        ["Frame ID", "Name", "Trigger", "Exit Points"],
        [
          ["F-AUD-01", "Document Library", "Documents tab or Quick Action", "Upload (F-AUD-02) or View existing audit (F-AUD-05)"],
          ["F-AUD-02", "Upload Entry Point", "Tap upload zone or '+' button", "File picker (F-AUD-03) or Cancel"],
          ["F-AUD-03", "Source Selection", "Upload zone tap (mobile)", "Camera (F-AUD-03a) or Files (F-AUD-03b) or Back"],
          ["F-AUD-03a", "Camera Capture", "Take Photo option", "Retake or Use Photo → F-AUD-04"],
          ["F-AUD-03b", "File Browser", "Choose from Files option", "File selected → F-AUD-04"],
          ["F-AUD-04", "Pre-Upload Review", "File selected", "Confirm Upload → F-AUD-05 or Retake/Re-select"],
          ["F-AUD-05", "Upload Processing", "Confirmed upload", "Audit starts automatically → F-AUD-06"],
          ["F-AUD-06", "Audit in Progress", "Post-upload", "Complete → F-AUD-07 or Error → F-AUD-08"],
          ["F-AUD-07", "Audit Complete Summary", "Audit finished", "Full Report (F-AUD-09) or Dashboard"],
          ["F-AUD-08", "Audit Error Recovery", "Audit failed", "Retry (F-AUD-05) or Support"],
          ["F-AUD-09", "Full Audit Report", "View Report tap", "Download PDF or Back to Summary"],
          ["F-AUD-10", "PDF Report", "Download/Share action", "Share sheet or Download"],
        ],
        [1200, 2400, 2400, 3360]
      ),

      spacer(1),
      h2("16.2 Camera Capture — Mobile UX (F-AUD-03a)"),
      frameBox("Camera Capture Screen — Passport/Document Photography", [
        h4("CAMERA VIEWFINDER"),
        para("Full-screen camera preview | Document detection overlay: rounded rectangle guide frame over center | Color: white outline normally, turns green when document detected within frame"),
        spacer(1),
        h4("CAPTURE GUIDANCE"),
        para("Top instruction bar: 'Align document within the guide frame' (white text on semi-transparent black bg)"),
        para("Auto-capture: triggers when document fills frame + is in focus + not blurry"),
        para("Manual capture: shutter button (bottom center, 72dp white circle)"),
        spacer(1),
        h4("QUALITY INDICATORS"),
        para("Blur detection: orange warning if camera shakes — 'Hold steady'"),
        para("Glare detection: orange warning if reflections detected — 'Avoid reflections'"),
        para("Darkness detection: orange warning — 'Move to better lighting'"),
        para("All clear: guide frame turns green — 'Perfect! Capturing...'"),
        spacer(1),
        h4("POST-CAPTURE PREVIEW"),
        para("Captured image shown full-screen | 'Looks good — Use Photo' (green button) | 'Retake' (outlined button) | Auto-crop to document bounds if confidence > 80%"),
      ]),

      spacer(1),
      h2("16.3 Audit Score Visualization"),
      simpleTable(
        ["Score Range", "Color", "Label", "Icon", "Recommended Action"],
        [
          ["90–100", "green-500 (#10B981)", "Excellent", "verified", "Ready to submit — no action needed"],
          ["75–89", "yellow-500 (#EAB308)", "Good", "thumb_up", "Minor improvements recommended"],
          ["50–74", "orange-500 (#F97316)", "Needs Attention", "warning", "Address warnings before submission"],
          ["25–49", "red-600 (#DC2626)", "Critical Issues", "error", "Must fix before submission"],
          ["0–24", "red-800 (#991B1B)", "Invalid Document", "cancel", "Document cannot be used — re-upload required"],
        ],
        [1200, 2400, 1600, 1200, 2960]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 17 — WEB RESPONSIVE DESIGN
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("17", "Web Responsive Design Specification", "Flutter Web — Adaptive Layouts for All Screen Sizes"),
      spacer(1),

      h2("17.1 Web-Specific Layout Patterns"),
      simpleTable(
        ["Screen", "Mobile (<768px)", "Tablet (768–1023px)", "Desktop (≥1024px)"],
        [
          ["Dashboard", "Stacked single column | Bottom navigation", "2-column grid cards | Nav drawer overlay", "3-column grid | Persistent left sidebar 240px"],
          ["Application detail", "Tab bar (4 tabs) | Single-column content", "2-pane: tabs left, content right", "3-pane: sidebar nav + main content + context panel"],
          ["Document library", "2-column grid or list toggle | Bottom sheet actions", "3-column grid | Side panel for audit details", "4-column grid | Persistent audit panel on right"],
          ["Requirements", "Full-width list | Fixed footer disclaimer", "2-column: categories left, details right", "3-column: search left, results center, source right"],
          ["Chat", "Full-screen | Bottom input | Back to apps", "Split: app list left | chat right", "3-panel: nav | chat | context (docs/requirements)"],
          ["Admin dashboard", "N/A (admin is web-only)", "Full-width stats + tables | Scrollable", "Split dashboard: stats top | data tables below | sidebar nav"],
        ],
        [2000, 2400, 2400, 2560]
      ),

      spacer(1),
      h2("17.2 Web-Specific Components"),
      frameBox("Web-Only UI Components", [
        h4("HOVER STATES (web cursor interactions)"),
        para("Cards: box-shadow deepens on hover (elevation.2 → elevation.3, 200ms) | cursor: pointer"),
        para("List items: background tint to slate-50 on hover | cursor: pointer"),
        para("Buttons: darken action color by 8% on hover | cursor: pointer"),
        para("Links: underline appears on hover | color shifts to darker shade"),
        spacer(1),
        h4("DRAG & DROP (web document upload)"),
        para("Drop zone: dashed border with 'Drag files here or click to browse'"),
        para("Drag over: border solid royal-600, background royal-50, scale icon 1.1"),
        para("Drag leave: returns to normal state"),
        para("Drop success: upload progress begins immediately"),
        spacer(1),
        h4("CONTEXT MENUS (right-click)"),
        para("Document cards: right-click shows context menu: View, Download, Re-upload, Delete, Share"),
        para("Application rows: right-click: Open, Duplicate, Archive, Delete"),
        spacer(1),
        h4("KEYBOARD SHORTCUTS (web)"),
        para("Ctrl/Cmd+K: Global search | N: New application | U: Upload document | /: Focus chat input"),
        para("Esc: Close modal/dialog/sheet | Tab: Navigate form fields | Enter: Submit form / Send chat"),
        spacer(1),
        h4("BREADCRUMB NAVIGATION"),
        para("Shows on pages 2+ levels deep: Dashboard > Applications > France — Schengen > Documents"),
        para("Each level is clickable. Active level is bold, not clickable."),
      ]),

      spacer(1),
      h2("17.3 Web-Specific: Data Tables"),
      para("Used in B2B dashboard, admin panels, and document management. Full specification:"),
      simpleTable(
        ["Feature", "Specification"],
        [
          ["Column headers", "Sortable (click to sort, toggle direction) | Resize handle (drag) | Filter icon per column (popover filter)"],
          ["Row interactions", "Hover: slate-50 bg | Click: opens detail panel or navigates | Selected: royal-50 bg + checkbox filled"],
          ["Bulk selection", "Header checkbox: select all on page | Sticky action bar appears on selection"],
          ["Pagination", "Per-page: 10/25/50/100 | Navigation: prev/next + page jump | Total count"],
          ["Empty state", "Centered illustration + message + CTA per empty reason"],
          ["Loading state", "Skeleton rows (same height as data rows) + shimmer animation"],
          ["Column visibility", "Settings icon: toggle columns on/off | Remember per-user preference"],
          ["Export", "Top-right: Export CSV / Export PDF button"],
        ],
        [2000, 7360]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 18 — FLUTTER IMPLEMENTATION NOTES
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("18", "Flutter-Specific Implementation Notes", "Widget Architecture · Theme System · Platform Adaptations"),
      spacer(1),

      h2("18.1 Flutter Theme Architecture"),
      frameBox("ThemeData Configuration Strategy", [
        h4("MATERIAL 3 BASE"),
        para("useMaterial3: true | ColorScheme generated from seed color: navy-900 (#0B1F4B)"),
        para("colorSchemeSeed: Color(0xFF0B1F4B) — Flutter generates full M3 tonal palette automatically"),
        spacer(1),
        h4("CUSTOM TOKEN OVERRIDE"),
        para("Semantic tokens defined as const values in lib/design_system/tokens.dart"),
        para("AppTheme class extends ThemeData with all VisaIQ-specific overrides"),
        spacer(1),
        h4("DARK MODE"),
        para("ThemeMode.system default — respects OS setting | Manual override in Settings screen"),
        para("All custom widgets use Theme.of(context) — no hardcoded colors in widgets"),
        spacer(1),
        h4("RESPONSIVE THEMING"),
        para("LayoutBuilder used at screen level to adapt spacing, font sizes, and layout based on constraints"),
        para("Breakpoint utility class: BreakpointUtils.of(context).isMobile, isTablet, isDesktop"),
      ]),

      spacer(1),
      h2("18.2 Widget Component Map"),
      simpleTable(
        ["Design Component", "Flutter Widget Implementation"],
        [
          ["Primary button", "ElevatedButton with custom ButtonStyle from AppTheme.primaryButtonStyle"],
          ["Outlined button", "OutlinedButton with custom ButtonStyle"],
          ["Text button", "TextButton with custom ButtonStyle"],
          ["Text field", "TextFormField inside Form widget with custom InputDecoration from AppTheme"],
          ["Country picker", "Custom widget: TextField + showModalBottomSheet with ListView.builder + SearchDelegate"],
          ["Document card", "Custom StatelessWidget: Card > Stack [image/icon + overlay] > Column [metadata]"],
          ["Score ring", "Custom painter: CustomPaint with CircularProgressPainter drawing arc by score value"],
          ["App bar", "SliverAppBar (collapsing) or AppBar with NavRail on desktop"],
          ["Bottom navigation", "NavigationBar (M3) with NavigationDestination items"],
          ["Bottom sheet", "showModalBottomSheet with DraggableScrollableSheet"],
          ["Toast/Snackbar", "ScaffoldMessenger.of(context).showSnackBar with custom SnackBar widget"],
          ["Chat bubble", "Custom widget with Align + Container + BoxDecoration varying by message role"],
          ["Audit findings list", "ExpansionTile inside ListView.builder"],
          ["Loading skeleton", "Shimmer package (shimmer: ^3.0.0) applied to placeholder containers"],
          ["Progress wizard", "Custom StepperWidget using IndexedStack for content switching"],
        ],
        [2800, 6560]
      ),

      spacer(1),
      h2("18.3 Flutter Web Adaptive Layout"),
      simpleTable(
        ["Layout Pattern", "Mobile", "Tablet", "Desktop"],
        [
          ["App shell", "Scaffold + BottomNavigationBar", "Scaffold + NavigationDrawer", "Row [NavigationRail + Expanded(content)]"],
          ["Content area", "Column (full width)", "Row (sidebar + main)", "Row (sidebar + main + detail panel)"],
          ["Grid system", "2 columns (GridView)", "3 columns (GridView)", "4 columns (GridView)"],
          ["Modal presentation", "showModalBottomSheet", "showModalBottomSheet (wider)", "showDialog (centered, max 480px wide)"],
          ["Navigation depth", "Push navigation (Navigator)", "Split-pane navigation", "URL-based navigation (GoRouter)"],
        ],
        [2400, 2320, 2320, 2320]
      ),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 19 — INTERACTION & ANIMATION
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("19", "Interaction & Animation Specification", "Motion Design — Timing, Curves & Micro-interactions"),
      spacer(1),

      h2("19.1 Animation Duration Tokens"),
      simpleTable(
        ["Token", "Duration", "Usage"],
        [
          ["duration.instant", "0ms", "State toggles with no visible transition (disabled/enabled)"],
          ["duration.fast", "100ms", "Icon state changes, color transitions, opacity fades"],
          ["duration.normal", "200ms", "Button press feedback, chip selection, checkbox toggle"],
          ["duration.moderate", "300ms", "Card hover elevation, toast appear, menu open"],
          ["duration.slow", "400ms", "Bottom sheet slide, modal fade+scale, page transitions"],
          ["duration.deliberate", "500ms", "Score ring fill animation, onboarding step transition"],
          ["duration.long", "800ms", "Splash screen elements, first-load animations"],
          ["duration.score", "1200ms", "Score ring fill on audit complete — intentionally slow for satisfaction"],
        ],
        [2400, 1200, 5760]
      ),

      spacer(1),
      h2("19.2 Easing Curves"),
      simpleTable(
        ["Curve Token", "Flutter Curve", "Usage"],
        [
          ["ease.standard", "Curves.easeInOut", "Most general transitions"],
          ["ease.decelerate", "Curves.easeOut", "Elements entering screen (slide in, fade in)"],
          ["ease.accelerate", "Curves.easeIn", "Elements leaving screen (slide out, fade out)"],
          ["ease.spring", "Curves.elasticOut (0.6 amp)", "FAB expand, confirmation success bounce"],
          ["ease.overshoot", "Custom cubic (0.34, 1.56, 0.64, 1.0)", "Score ring completion bounce"],
          ["ease.linear", "Curves.linear", "Continuous loops: loading spinner, shimmer, progress bars"],
        ],
        [2400, 2400, 4560]
      ),

      spacer(1),
      h2("19.3 Key Micro-interaction Specifications"),
      simpleTable(
        ["Interaction", "Duration", "Curve", "Properties Animated"],
        [
          ["Button press state", "80ms in / 200ms out", "easeIn / easeOut", "scale: 1.0→0.97 + color darken"],
          ["Card hover (web)", "200ms", "ease.standard", "boxShadow elevation.2→elevation.3"],
          ["Bottom nav tab switch", "250ms", "ease.decelerate", "icon scale 1.0→1.1 + fill state change"],
          ["Page transition (push)", "300ms", "ease.decelerate", "slide right 100%→0% + fade 0.7→1.0"],
          ["Page transition (pop)", "250ms", "ease.accelerate", "slide right 0%→30% + fade 1.0→0.7"],
          ["Score ring fill", "1200ms", "ease.overshoot", "arc sweep 0→score%, color transition"],
          ["Toast notification", "250ms enter / 200ms exit", "ease.decelerate / ease.accelerate", "translateY 100%→0% (mobile) or translateX 100%→0% (web)"],
          ["Bottom sheet open", "350ms", "ease.decelerate", "translateY 100%→0% + scrim fade in"],
          ["Chip select", "150ms", "ease.standard", "background color + border change + checkmark scale"],
          ["Input focus", "150ms", "ease.standard", "border color + width change + label float"],
          ["Document upload progress", "Linear", "Linear", "Progress bar width 0%→100%"],
          ["Audit complete bounce", "500ms", "ease.spring", "score card scale 0.9→1.05→1.0"],
        ],
        [2400, 1400, 1400, 4160]
      ),

      spacer(1),
      h2("19.4 Reduced Motion Support"),
      callout("Flutter Implementation for Reduced Motion", "Check: MediaQuery.of(context).disableAnimations\nWhen true: Replace all AnimatedWidget, AnimationController, and Hero transitions with instant state changes\nExceptions: Loading indicators (functional, not decorative) — replace pulsing animation with static 'Processing...' text\nFlutter implementation: Create AnimationUtils.duration(context, base) helper that returns 0ms when reduced motion enabled", C.sectionBg, C.orange),

      pageBreak(),

      // ════════════════════════════════════════════════════════════════════════
      // SECTION 20 — ACCESSIBILITY
      // ════════════════════════════════════════════════════════════════════════
      sectionDivider("20", "Accessibility & Inclusive Design", "WCAG 2.1 AA — Flutter Semantics — Screen Reader Support"),
      spacer(1),

      h2("20.1 Color Contrast Requirements"),
      simpleTable(
        ["Text Type", "Minimum Ratio", "Target Ratio", "Check Required On"],
        [
          ["Normal text (< 18pt)", "4.5:1", "7:1", "All text on all backgrounds"],
          ["Large text (≥ 18pt bold or ≥ 24pt)", "3:1", "4.5:1", "Headings, display text"],
          ["UI components / icons", "3:1", "4.5:1", "Buttons, form fields, icons"],
          ["Placeholder text", "4.5:1 — must not rely on placeholder only", "—", "All text fields"],
          ["Disabled text", "Exception: no requirement | Must be visually distinct", "—", "All disabled states"],
          ["Status colors on white", "See Section 2.1 for all values", "—", "Dashboard status chips"],
        ],
        [2400, 1600, 1600, 3760]
      ),

      spacer(1),
      h2("20.2 Flutter Semantics Implementation"),
      simpleTable(
        ["Component", "Flutter Semantics Implementation"],
        [
          ["Icon-only buttons", "Semantics(label: 'Upload document', child: IconButton(...))"],
          ["Score ring", "Semantics(value: 'Audit score: 87 out of 100, Good', child: CustomPaint(...))"],
          ["Status chips", "Semantics(label: 'Application status: Under review', child: Chip(...))"],
          ["Document cards", "Semantics(label: 'Passport document, audit score 92, tap to view report', child: DocumentCard(...))"],
          ["AI-generated content", "Semantics(label: 'AI generated: [content]. This is AI guidance, not legal advice.', ...)"],
          ["Progress wizard steps", "Semantics(label: 'Step 2 of 4: Destination. Completed steps: Nationality', ...)"],
          ["Loading states", "Semantics(liveRegion: true, label: 'AI audit in progress', child: LoadingIndicator())"],
          ["Chat messages", "Semantics(label: 'AI Assistant says: [message text]' or 'You said: [message text]', ...)"],
          ["Error messages", "Semantics(liveRegion: true, label: 'Error: [error message]', child: ErrorWidget())"],
        ],
        [2400, 6960]
      ),

      spacer(1),
      h2("20.3 Focus Management"),
      simpleTable(
        ["Context", "Focus Behavior"],
        [
          ["Modal / dialog opens", "Focus moves to first interactive element inside modal"],
          ["Modal / dialog closes", "Focus returns to the trigger element"],
          ["Form submission with errors", "Focus moves to first field with an error"],
          ["Toast notification", "Announced via liveRegion — focus stays on current element"],
          ["Navigation between screens", "Focus starts at top of new screen content, not the back button"],
          ["Dynamic content loading", "New content announced via liveRegion: true if user-triggered"],
          ["Chat — new message received", "Announced via liveRegion — focus stays in input"],
        ],
        [2400, 6960]
      ),

      spacer(1),
      h2("20.4 Inclusive Design Considerations"),
      simpleTable(
        ["User Consideration", "Design Decision"],
        [
          ["Anxiety around rejection", "Reframe language: 'Let's see how we can strengthen your application' not 'Issues found'"],
          ["Language barrier", "Passport scan auto-populates fields — reduces manual entry errors for non-English speakers"],
          ["Low digital literacy", "Onboarding wizard + tutorial overlays with option to skip | Help button always accessible"],
          ["Slow connection", "Offline mode for read-only | Optimized image compression | Progress preserved on reconnect"],
          ["Older users", "Dynamic text sizing supported (Flutter: textScaleFactor) | No time-limited actions | Large touch targets"],
          ["Color blindness", "Status never communicated by color alone — always includes icon + text label"],
          ["Screen reader users", "All document thumbnails have descriptive alt semantics | Audit findings read in order of severity"],
          ["RTL languages (Arabic, Hebrew)", "Flutter Directionality widget | All layouts use start/end not left/right | Test with Arabic content"],
        ],
        [2400, 6960]
      ),

      spacer(1),

      // FINAL SUMMARY TABLE
      h1("Appendix A — Complete Frame Inventory"),
      spacer(1),
      para("Summary of all frames specified in this document:"),
      simpleTable(
        ["Frame ID", "Name", "User Type", "Platform"],
        [
          ["F-SPLASH-01", "Splash Screen", "All", "Mobile + Web"],
          ["F-WELCOME-01", "Welcome Screen", "Unauthenticated", "Mobile + Web"],
          ["F-AUTH-REG-01", "Email Registration", "New User", "Mobile + Web"],
          ["F-AUTH-VERIFY-01", "Email Verification", "New User", "Mobile + Web"],
          ["F-AUTH-LOGIN-01", "Login Screen", "Returning User", "Mobile + Web"],
          ["F-ONBOARD-01 to 04", "Onboarding Wizard (4 frames)", "All new users", "Mobile + Web"],
          ["F-DASH-CON-01", "Consumer Dashboard", "Tourist + Professional", "Mobile + Web"],
          ["F-APP-NEW-01 to 05", "New Application Wizard (5 frames)", "All", "Mobile + Web"],
          ["F-APP-DETAIL-01", "Application Detail (4 tabs)", "All", "Mobile + Web"],
          ["F-DOC-UPLOAD-01 to 06", "Document Upload (6 states)", "All", "Mobile + Web"],
          ["F-AUDIT-REPORT-01", "Audit Report Detail", "All", "Mobile + Web"],
          ["F-REQ-01", "Live Requirements", "All", "Mobile + Web"],
          ["F-CHAT-01", "AI Chat", "All", "Mobile + Web"],
          ["F-BOOKING-01 to 04", "VIP Booking (4 frames)", "All", "Mobile + Web"],
          ["F-DASH-PRO-01", "Professional Dashboard", "Pro Consumer", "Mobile + Web"],
          ["F-PRO-APPS-01", "Multi-Application Manager", "Pro Consumer", "Mobile + Web"],
          ["F-PRO-DOCS-01", "Advanced Document Management", "Pro Consumer", "Mobile + Web"],
          ["F-PRO-CHAT-01", "Advanced Chat", "Pro Consumer", "Mobile + Web"],
          ["F-DASH-B2B-01", "HR Manager Dashboard", "B2B Manager", "Mobile + Web"],
          ["F-B2B-BULK-01", "Bulk Document Upload", "B2B Manager", "Web Primary"],
          ["F-B2B-TEAM-01", "Employee Management", "B2B Manager", "Web Primary"],
          ["F-B2B-REPORTS-01", "Compliance Reports", "B2B Manager", "Web Primary"],
          ["F-ADMIN-DASH-01", "Admin Dashboard", "Admin", "Web Only"],
          ["F-ADMIN-USERS-01", "User Management", "Admin", "Web Only"],
          ["F-ADMIN-AI-01", "AI Monitoring", "Admin", "Web Only"],
          ["F-AUD-01 to 10", "Full Audit Flow (10 frames)", "All", "Mobile + Web"],
        ],
        [2000, 3200, 2200, 1960]
      ),

      spacer(2),

      // CLOSING
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: allNoBorders(),
          shading: { fill: C.headerBg, type: ShadingType.CLEAR },
          margins: { top: 320, bottom: 320, left: 480, right: 480 },
          width: { size: 9360, type: WidthType.DXA },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "VisaIQ Design System PRD", font: "Arial", size: 36, bold: true, color: C.white })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "v2.0 — Flutter (Web + Android + iOS)", font: "Arial", size: 22, color: C.slate400 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "READY FOR DESIGN HANDOFF & FLUTTER IMPLEMENTATION", font: "Arial", size: 20, bold: true, color: C.teal })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 0 }, children: [new TextRun({ text: "May 2026  |  Confidential  |  VisaIQ Product Team", font: "Arial", size: 18, color: C.slate400, italics: true })] }),
          ]
        })]})],
      }),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/mnt/user-data/outputs/VisaIQ_Design_System_PRD_v2.docx', buffer);
  console.log('SUCCESS: VisaIQ Design System PRD created');
}).catch(err => {
  console.error('ERROR:', err);
});
