const { Location } = require("../models");

async function listLocation(req, res, next) {
  try {
    const locations = await Location.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ locations });
  } catch (err) {
    next(err);
  }
}

async function createLocation(req, res, next) {
  try {
    const raw = req.body.name;
    const name = String(raw || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Location name is required" });
    }

    const location = await Location.create({ name });
    res.status(201).json({ location });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Location name already exists" });
    }
    next(err);
  }
}

async function getLocationById(req, res, next) {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json({ location });
  } catch (err) {
    next(err);
  }
}

async function updateLocation(req, res, next) {
  try {
    const raw = req.body.name;
    const name = String(raw || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Location name is required" });
    }

    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ message: "Location not found" });

    location.name = name;
    await location.save();
    res.json({ location });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Location name already exists" });
    }
    next(err);
  }
}

async function deleteLocation(req, res, next) {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ message: "Location not found" });

    await location.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLocation,
  createLocation,
  getLocationById,
  updateLocation,
  deleteLocation,
};
