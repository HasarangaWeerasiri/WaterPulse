import ContaminationReport from "../models/contaminationReport.js";
import axios from "axios";
import reportService from "../services/reportService.js";

// Create Report (citizen only)
export const createReport = async (req, res) => {
  try {
    const { title, description, latitude, longitude, imageUrl } = req.body;

    // Remove image from required check
    if (!title || !description || !latitude || !longitude) {
      return res.status(400).json({ message: "Title, description, latitude and longitude are required" });
    }

    // If image exists, validate it
    if (imageUrl) {
      const urlPattern = /^https?:\/\//i;
      if (!urlPattern.test(imageUrl)) {
        return res.status(400).json({
          message: "Image URL must start with http:// or https://"
        });
      // Update full report details (citizen: own reports only, admin/authority: any)
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

    // Only add image if provided
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

// Get single report by ID (admin can see any, citizen only own)
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

// Update report content or status
// - Citizens: can update their own title, description, location (via latitude/longitude) and imageUrl
// - Admin/authority: can update status field only
export const updateReport = async (req, res) => {
  try {
    const report = await ContaminationReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Citizen can update only their own report
    if (req.userRole === "citizen" && report.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Admin/authority: only status updates allowed
    if (req.userRole === "admin" || req.userRole === "authority") {
      if (req.body.status) {
        report.status = req.body.status;
      } else {
        return res.status(400).json({ message: "Admins can only update status" });
      }
    } else if (req.userRole === "citizen") {
      // Citizens can only edit reports that are still Unverified
      if (report.status !== "Unverified") {
        return res.status(400).json({
          message: "You can only edit reports that are still Unverified"
        });
      }

      // Citizens can update title, description, location, imageUrl
      const { title, description, latitude, longitude, imageUrl } = req.body;

      if (title) report.title = title;
      if (description) report.description = description;

      // If user selected a new point on the map, update both location and address
      if (latitude && longitude) {
        // Update geolocation
        report.location = {
          type: "Point",
          coordinates: [longitude, latitude]
        };

        // Try to reverse geocode new coordinates
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

          report.address = geoResponse.data.display_name;
        } catch (geoError) {
          console.error("Geocoding error (update):", geoError.message);
          // keep previous address if lookup fails
        }
      }

      if (imageUrl) report.imageUrl = imageUrl;
    }

    await report.save();

    res.status(200).json({
      message: "Report updated successfully",
      report
    });

  } catch (error) {
    console.error("Update report error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Status-only update endpoint, mainly for admin/authority dashboards
export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const report = await ContaminationReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Only admin/authority should change status via this endpoint
    if (req.userRole !== "admin" && req.userRole !== "authority") {
      return res.status(403).json({ message: "Not authorized to update status" });
    }

    report.status = status;
    await report.save();

    res.status(200).json({
      message: "Status updated successfully",
      report
    });
  } catch (error) {
    console.error("Update report status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete report
// - Citizen: can delete only their own report
// - Admin/authority: can delete any report
export const deleteReport = async (req, res) => {
  try {
    const report = await ContaminationReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // If citizen, ensure they own this report
    if (req.userRole === "citizen" && report.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this report" });
    }

    // Optionally, you could also restrict other roles here if needed

    await report.deleteOne();

    res.status(200).json({ message: "Report deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


