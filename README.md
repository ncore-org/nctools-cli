# nctools — CLI

Command-line tools mirroring every document utility on **nctools.eu**.
Each tool is a standalone, individually-installable CLI — and a meta
package installs all of them into a single `nctools` command.

## Tools

| Package (standalone) | Binary | Website equivalent |
| --- | --- | --- |
| `@nctools/paste-to-pdf` | `nctools-paste-to-pdf` | `/tools/paste-to-pdf` |
| `@nctools/pdf-to-word` | `nctools-pdf-to-word` | `/tools/pdf-to-word` |
| `@nctools/pdf-to-excel` | `nctools-pdf-to-excel` | `/tools/pdf-to-excel` |
| `@nctools/pdf-to-ocr` | `nctools-pdf-to-ocr` | `/tools/pdf-to-ocr` |
| `@nctools/ocr-to-text` | `nctools-ocr-to-text` | `/tools/ocr-to-text` |

## Install

Install **one tool** standalone:

```bash
npm install -g @nctools/pdf-to-word
```

Install **everything** (meta package, single `nctools` command with all subcommands):

```bash
npm install -g @nctools/cli
```

## Usage

### Individual binaries

```bash
# Paste to PDF
nctools-paste-to-pdf --input notes.txt --output notes.pdf

# PDF to Word
nctools-pdf-to-word --input doc.pdf --output doc.docx

# PDF to Excel
nctools-pdf-to-excel --input tab.pdf --output tab.xlsx

# PDF to OCR (make scanned PDFs searchable)
nctools-pdf-to-ocr --input scan.pdf --lang eng+sk

# OCR to Text
nctools-ocr-to-text --input image.png --output out.txt
```

### Meta command

```bash
nctools paste-to-pdf --input notes.txt --output notes.pdf
nctools pdf-to-word --input doc.pdf --output doc.docx
nctools --help
nctools <tool> --help
```

### Common options

Every tool accepts:

- `--input <file>` — source file (`-i`)
- `--output <file>` — destination file (`-o`); when omitted, printed to stdout or a derived filename
- `--quiet` / `--json` — machine-readable JSON output
- `--help` — command help

## Development

```bash
npm run bootstrap   # install all workspaces
npm run build       # build every package (TypeScript)
npm run test        # run tests
```

## License

MIT