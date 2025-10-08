const { Vendor_Catering } = require("../models");

async function attachVendorCatering(req, res, next) {
  try {
    if (req.user?.role === "vendor_catering") {
      const vendor = await Vendor_Catering.findOne({
        where: { user_id: req.user.id },
        attributes: ["id", "name", "user_id"],
      });

      if (!vendor) {
        console.warn(`[attachVendorCatering] Tidak menemukan vendor_catering untuk user_id=${req.user.id}`);
      } else {
        console.log(`[attachVendorCatering] Vendor ditemukan:`, vendor.id);
        req.vendor_catering_id = vendor.id;
      }
    }
    next();
  } catch (err) {
    console.error("attachVendorCatering error:", err);
    next(err);
  }
}

module.exports = attachVendorCatering;
