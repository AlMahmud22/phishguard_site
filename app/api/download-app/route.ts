import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { Readable } from "stream";

export async function GET() {
  try {
    const downloadsPath = path.join(process.cwd(), "downloads");

    // Check if downloads folder exists
    if (!fs.existsSync(downloadsPath)) {
      // Create the downloads folder if it doesn't exist
      fs.mkdirSync(downloadsPath, { recursive: true });
    }

    // Create a zip archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Create a readable stream from the archive
    const stream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk) => {
          controller.enqueue(chunk);
        });

        archive.on("end", () => {
          controller.close();
        });

        archive.on("error", (err) => {
          controller.error(err);
        });

        // Check if directory has any contents
        const files = fs.readdirSync(downloadsPath);
        
        if (files.length > 0) {
          // Add all files and folders from downloads directory
          archive.directory(downloadsPath, false);
        } else {
          // If empty, add a placeholder file
          archive.append("This archive is empty. No files are currently available for download.", {
            name: "README.txt",
          });
        }

        // Finalize the archive
        archive.finalize();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="PhishGuard-Setup.zip"`,
      },
    });
  } catch (error) {
    console.error("Error creating zip file:", error);
    return NextResponse.json(
      { error: "Failed to create download package" },
      { status: 500 }
    );
  }
}
