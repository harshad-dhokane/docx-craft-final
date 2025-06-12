import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pdfConverter } from "~/lib/pdfConverter.server"; // ~ refers to app/

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File; // Type assertion

    if (!file || typeof file.name !== 'string' || file.size === 0) {
      return json({ error: "No file provided or file is invalid" }, { status: 400 });
    }

    const fileName = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Optional: Check LibreOffice availability first
    const isLOAvailable = await pdfConverter.checkLibreOfficeAvailability();
    if (!isLOAvailable) {
        return json({ error: "PDF conversion service is unavailable" }, { status: 503 });
    }

    const pdfBuffer = await pdfConverter.convertToPDF(buffer, fileName);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName.replace(/\.[^/.]+$/, "")}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF conversion failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error during PDF conversion";
    return json({ error: "PDF conversion failed", details: errorMessage }, { status: 500 });
  }
};
