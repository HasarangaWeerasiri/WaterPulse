import ContaminationReport from "../models/contaminationReport.js";
import axios from "axios";
import reportService from "../services/reportService.js";

// Create Report (citizen only)
export const createReport = async (req, res) => {
  try {
    const { title, description, latitude, longitude, imageUrl } = req.body;

    // ✅ Remove image from required check
    if (!title || !description || !latitude || !longitude) {
      return res.status(400).json({ message: "Title, description, latitude and longitude are required" });
    }

    // ✅ If image exists, validate it
    if (imageUrl) {
      const urlPattern = /^https?:\/\//i;
      if (!urlPattern.test(imageUrl)) {
        return res.status(400).json({
          message: "Image URL must start with http:// or https://"
        });
      }
    }

    // Reverse geocoding using OpenStreetMap
    let address = null;
    try {
      const geoResponse = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: "json"
          },
          headers: {
            "User-Agent":
              process.env.NOMINATIM_USER_AGENT ||
              "WaterPulse/1.0 (contact@example.com)",
            "Accept-Language": "en"
          }
        }
      );

      address = geoResponse.data.display_name;
    } catch (geoError) {
      console.error("Geocoding error:", geoError.message);
      address = null; // Don't block report creation
    }

    const report = new ContaminationReport({
      title,
      description,
      address,
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      reportedBy: req.userId
    });

    // ✅ Only add image if provided
    if (imageUrl) {
      report.imageUrl = imageUrl;
    }

    await report.save();

    res.status(201).json({
      message: "Report created successfully",
      report
    });

  } catch (error) {
    console.error("Create report error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all reports (for admin/authority)
export const getAllReports = async (req, res) => {
  try {
    const reports = await ContaminationReport.find()
      .populate("reportedBy", "firstName email role");

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    let report;

    if (req.userRole === "admin") {
      // Admin can fetch any
      report = await ContaminationReport.findById(req.params.id)
        .populate("reportedBy", "firstName email role");
    } else {
      // Citizen can fetch only their own
      report = await ContaminationReport.findOne({
        _id: req.params.id,
        reportedBy: req.userId
      }).populate("reportedBy", "firstName email role");
    }

    if (!report) {
      return res.status(404).json({ message: "Report not found or not authorized" });
    }

    res.status(200).json(report);

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get logged-in user's reports (citizen only)
export const getMyReports = async (req, res) => {
  try {
    const reports = await ContaminationReport.find({
      reportedBy: req.userId
    }).populate("reportedBy", "firstName email role");

    res.status(200).json(reports);

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get reports within radius (for map)
export const getReportsByRadius = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng || !radius) {
      return res.status(400).json({ message: "Latitude, longitude and radius required" });
    }

    const reports = await ContaminationReport.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            radius / 6378.1
          ]
        }
      }
    }).populate("reportedBy", "firstName email role");

    res.status(200).json(reports);

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update report status (citizen: own reports only, admin/authority: any)
export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await ContaminationReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Citizen can update only their own report
    if (req.userRole === "citizen" && report.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    report.status = status;
    await report.save();

    res.status(200).json({ message: "Status updated", report });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete report (admin only – enforced in route middleware)
export const deleteReport = async (req, res) => {
  try {
    const report = await ContaminationReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    await report.deleteOne();

    res.status(200).json({ message: "Report deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get pending reports (for authority/admin)
export const getPendingReports = async (req, res) => {
  try {
    const pendingReports = await reportService.getPendingReports();
    
    res.status(200).json({
      message: "Pending reports retrieved successfully",
      count: pendingReports.length,
      reports: pendingReports
    });
  } catch (error) {
    console.error("Get pending reports error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};
