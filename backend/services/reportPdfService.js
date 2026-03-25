import PDFDocument from "pdfkit";

// Single-responsibility service for generating PDF buffers for contamination reports.
// It does not know about Express or HTTP, only about turning domain data into PDFs.

const createBaseDoc = () => {
  return new PDFDocument({ margin: 50 });
};

const buildHeader = (doc, title) => {
  doc
    .fontSize(18)
    .fillColor("#164871")
    .text("WaterPulse", { align: "left" })
    .moveDown(0.3);

  doc
    .fontSize(12)
    .fillColor("#608A9A")
    .text(title, { align: "left" })
    .moveDown(0.5);

  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor("#9BBEC9")
    .lineWidth(1)
    .stroke()
    .moveDown(1);
};

const asDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const writeKeyValue = (doc, label, value) => {
  doc
    .fontSize(10)
    .fillColor("#555")
    .text(label + ":", { continued: true })
    .fillColor("#111")
    .text(" " + (value || "-"))
    .moveDown(0.2);
};

export const buildSingleReportPdf = (report) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      buildHeader(doc, "Contamination Report");

      // Basic meta
      writeKeyValue(doc, "Report ID", report._id?.toString());
      writeKeyValue(doc, "Status", report.status || "Unverified");
      writeKeyValue(doc, "Created At", asDate(report.createdAt));

      const reporterName = report.reportedBy?.firstName || "-";
      const reporterEmail = report.reportedBy?.email || "-";
      writeKeyValue(doc, "Reporter", reporterName + " (" + reporterEmail + ")");

      if (report.address) {
        writeKeyValue(doc, "Address", report.address);
      }

      const [lng, lat] = report.location?.coordinates || [];
      if (lat && lng) {
        writeKeyValue(doc, "Coordinates", `${lat}, ${lng}`);
      }

      doc.moveDown(0.8);

      // Title & description
      doc
        .fontSize(13)
        .fillColor("#164871")
        .text(report.title || "(No title)", { underline: true })
        .moveDown(0.4);

      doc
        .fontSize(11)
        .fillColor("#222")
        .text(report.description || "(No description provided)", {
          align: "left",
        })
        .moveDown(0.8);

      if (report.imageUrl) {
        writeKeyValue(doc, "Image URL", report.imageUrl);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const buildAllReportsPdf = (reports) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      buildHeader(doc, "All Contamination Reports");

      if (!reports.length) {
        doc
          .fontSize(11)
          .fillColor("#555")
          .text("No reports available.", { align: "left" });
        doc.end();
        return;
      }

      reports.forEach((report, index) => {
        doc
          .fontSize(12)
          .fillColor("#164871")
          .text(`${index + 1}. ${report.title || "(No title)"}`)
          .moveDown(0.2);

        writeKeyValue(doc, "Status", report.status || "Unverified");
        writeKeyValue(doc, "Created At", asDate(report.createdAt));

        const reporterName = report.reportedBy?.firstName || "-";
        const reporterEmail = report.reportedBy?.email || "-";
        writeKeyValue(doc, "Reporter", reporterName + " (" + reporterEmail + ")");

        if (report.address) {
          writeKeyValue(doc, "Address", report.address);
        }

        if (report.description) {
          doc
            .fontSize(10)
            .fillColor("#222")
            .text(report.description, { align: "left" })
            .moveDown(0.4);
        }

        if (index < reports.length - 1) {
          doc
            .moveDown(0.3)
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .strokeColor("#e0e7ff")
            .lineWidth(0.5)
            .stroke()
            .moveDown(0.6);
        }
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  buildSingleReportPdf,
  buildAllReportsPdf,
};
