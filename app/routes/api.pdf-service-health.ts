import { json, LoaderFunctionArgs } from "@remix-run/node";
import { pdfConverter } from "~/lib/pdfConverter.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const isAvailable = await pdfConverter.checkLibreOfficeAvailability();
    return json({
      status: isAvailable ? "healthy" : "unavailable",
      libreoffice: isAvailable,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("PDF service health check failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return json({ status: "error", error: errorMessage }, { status: 500 });
  }
};
