/**
 * Meta CLI — exposes a single `nctools` command that registers every tool
 * package as a subcommand. Installs everything in one `npm i -g @nctools/cli`.
 */
import { Command } from "commander";
import { NAME, VERSION, REPO } from "@nctools/core";
import pasteToPdfCli from "@nctools/paste-to-pdf";
import pdfToWordCli from "@nctools/pdf-to-word";
import pdfToExcelCli from "@nctools/pdf-to-excel";
import pdfToOcrCli from "@nctools/pdf-to-ocr";
import ocrToTextCli from "@nctools/ocr-to-text";
import photoScannerCli from "@nctools/photo-scanner";
import imagesToPdfCli from "@nctools/images-to-pdf";
import mergePdfCli from "@nctools/merge-pdf";

export interface MetaCliOptions {
  commandName?: string;
}

export function buildMetaCli(opts: MetaCliOptions = {}): Command {
  const name = opts.commandName ?? NAME;
  const program = new Command();
  program
    .name(name)
    .description("nctools.eu document tools, right in your terminal.")
    .version(VERSION, "-v, --version")
    .showHelpAfterError();

  // Register every tool as a subcommand (bare name: `nctools paste-to-pdf`).
  program.addCommand(pasteToPdfCli("paste-to-pdf"), { isDefault: false });
  program.addCommand(pdfToWordCli("pdf-to-word"));
  program.addCommand(pdfToExcelCli("pdf-to-excel"));
  program.addCommand(pdfToOcrCli("pdf-to-ocr"));
  program.addCommand(ocrToTextCli("ocr-to-text"));
  program.addCommand(photoScannerCli("photo-scanner"));
  program.addCommand(imagesToPdfCli("images-to-pdf"));
  program.addCommand(mergePdfCli("merge-pdf"));

  // Provide `nctools tools` listing.
  program
    .command("tools")
    .description("List every available nctools tool")
    .action(() => {
      const tools = [
        ["paste-to-pdf", "Turn pasted text into a PDF"],
        ["pdf-to-word", "Convert PDF to editable DOCX"],
        ["pdf-to-excel", "Extract PDF tables to XLSX"],
        ["pdf-to-ocr", "Make PDFs searchable"],
        ["ocr-to-text", "Extract text from images"],
        ["photo-scanner", "Scan an image to PDF or text"],
        ["images-to-pdf", "Combine images into one PDF"],
        ["merge-pdf", "Merge multiple PDFs into one"],
      ];
      process.stdout.write("Available nctools tools:\n\n");
      for (const [t, d] of tools) {
        const toolName = t as string;
        process.stdout.write(`  ${name}-${toolName.padEnd(14)} ${d}\n`);
      }
      process.stdout.write(`\nRun ${name} <tool> --help for details.\n`);
    });

  program.configureHelp({ sortSubcommands: true });
  program.addHelpText(
    "after",
    `\nMeta package — installs all tools. Repo: ${REPO}\nIndividual tools are also installable on their own (e.g. @nctools/pdf-to-word).\n`,
  );

  // If no subcommand given, show help.
  program.action(() => program.help());

  return program;
}

export default buildMetaCli;