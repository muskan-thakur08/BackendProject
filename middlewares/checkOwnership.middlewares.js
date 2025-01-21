import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";

const checkOwnership = (Model, ownershipField = "owner", paramField = "id") =>
  asyncHandler(async (req, _, next) => {
    const id = req.params[paramField]; // Dynamically get the param field

    // Validate  ID
    if (!id || !isValidObjectId(id)) {
      throw new ApiError(404, "Invalid  ID");
    }

    // Fetch the /resource
    const resource = await Model.findById(id);
    if (!resource) {
      throw new ApiError(404, "Resource not found");
    }

    // Check ownership
    if (req.user._id.toString() !== resource[ownershipField].toString()) {
      throw new ApiError(403, "Unauthorized to access this resource");
    }

    // Attach the resource to the request object
    req.resource = resource;
    next();
  });

export { checkOwnership };