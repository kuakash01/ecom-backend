
const carouselImage = require("../../models/carouselImage.model");
const cloudinary = require("../../config/cloudinary");
const streamifier = require('streamifier');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};


const getCarousel = async (req, res) => {
  try {
    const carousel = await carouselImage.find();
    if (!carousel)
      res.status(400).json({ status: "failed", message: "Images not found" });

    res.status(200).json({ status: "success", message: "Carousel Fetch successfully", data: carousel });


  } catch (err) {
    res.status(500).json({ status: "failed", message: "Internal Server Error" })
  }
}

// const addCarouselImage = async (req, res) => {
//   try {
//     const { position } = req.body;
//     const image = req.file;

//     // Upload image here (Cloudinary etc.)
//     const imageResult = await uploadToCloudinary(image.buffer, "carousel")

//     // Step 1: Insert with temporary position
//     const tempPos = 999999;
//     const newImage = await carouselImage.create({
//       position: tempPos,
//       image: {
//         url: imageResult.secure_url,
//         public_id: imageResult.public_id
//       }
//     });

//     // Step 2: Shift existing positions
//     await carouselImage.updateMany(
//       { position: { $gte: Number(position) }, _id: { $ne: newImage._id } },
//       { $inc: { position: 1 } }
//     );

//     // Step 3: Update new image to correct position
//     newImage.position = Number(position);
//     await newImage.save();

//     res.status(200).json({
//       status: "success",
//       message: "Carousel Image Uploaded",
//       carouselImage: newImage
//     });

//   } catch (err) {
//     console.log("error", err);
//     res.status(500).json({
//       status: "failed",
//       message: "Internal server error",
//       err
//     });
//   }
// };

const addCarouselImage = async (req, res) => {
  try {
    let { position, redirectType, redirectValue } = req.body;
    const image = req.files?.desktopImage?.[0]; // Access desktop image from the uploaded files
    const mobileImage = req.files?.mobileImage?.[0]; // Access mobile image from the uploaded files

    if (!image) {
      return res.status(400).json({ status: "failed", message: "Desktop image is required" });
    }
    if (!mobileImage) {
      return res.status(400).json({ status: "failed", message: "Mobile image is required" });
    }


    const imageResult = await uploadToCloudinary(image.buffer, "carousel");
    const mobileImageResult = await uploadToCloudinary(mobileImage.buffer, "carousel");

    // If no position provided, get the last position + 1
    if (!position) {
      const last = await carouselImage.findOne().sort({ position: -1 });
      position = last ? last.position + 1 : 1;
    }

    // Step 1: Insert with temporary position
    const tempPos = 999999;
    const newImage = await carouselImage.create({
      position: tempPos,
      desktopImage: {
        url: imageResult.secure_url,
        public_id: imageResult.public_id
      },
      mobileImage: {
        url: mobileImageResult.secure_url,
        public_id: mobileImageResult.public_id
      },
      redirectType,
      redirectValue
    });

    // Step 2: Shift existing items only if position falls inside range
    await carouselImage.updateMany(
      { position: { $gte: Number(position) }, _id: { $ne: newImage._id } },
      { $inc: { position: 1 } }
    );

    // Step 3: Place new image in the correct position
    newImage.position = Number(position);
    await newImage.save();

    res.status(200).json({
      status: "success",
      message: "Carousel Image Uploaded",
      carouselImage: newImage
    });

  } catch (err) {
    console.log("error", err);
    res.status(500).json({
      status: "failed",
      message: "Internal server error",
      err
    });
  }
};



const updateImageStatus = async (req, res) => {
  try {
    const { carouselId } = req.params;
    const { status } = req.body;

    const image = await carouselImage.findOneAndUpdate(
      { _id: carouselId },
      { status: status },
      { new: true }
    );

    if (!image) {
      return res.status(404).json({
        status: "failed",
        message: "Image not found"
      });
    }

    res.status(200).json({
      status: "success",
      message: "Image status updated",
      data: image
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error
    });
  }
};

// const updatePosition = async (req, res) => {
//   try {
//     const { carouselId } = req.params;
//     const { position } = req.body;
//     if (!position) {
//       return res.status(400).json({ message: "Position is required" });
//     }

//     const image = await carouselImage.findById(carouselId);
//     if (!image) {
//       return res.status(404).json({ message: "Image not found" });
//     }

//     // Get current position
//     const oldPosition = image.position;

//     // Step 1: If the new position is same, do nothing
//     if (oldPosition === position) {
//       return res.json({ message: "Position unchanged", image });
//     }

//     // Step 2: Shift other images
//     await carouselImage.updateMany(
//       {
//         _id: { $ne: carouselId },
//         position: { $gte: position }
//       },
//       { $inc: { position: 1 } }
//     );

//     // Step 3: Update the requested image
//     image.position = position;
//     await image.save();

//     res.json({
//       message: "Position updated successfully",
//       data: image
//     });


//   } catch (error) {
//     res.status(500).json({ status: "failed", message: "Internal Server Error" });
//     console.log("update error", error);
//   }
// }

const updatePosition = async (req, res) => {
  try {
    const { carouselId } = req.params;
    const newPosition = Number(req.body.position);

    if (!newPosition) {
      return res.status(400).json({ message: "Position is required" });
    }

    const image = await carouselImage.findById(carouselId);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const oldPosition = image.position;

    if (oldPosition === newPosition) {
      return res.json({ message: "Position unchanged", data: image });
    }

    // Check if new position already exists
    const exists = await carouselImage.findOne({
      position: newPosition,
      _id: { $ne: carouselId }
    });

    if (!exists) {
      // Position free, just move it
      image.position = newPosition;
      await image.save();

      return res.json({
        message: "Position updated without shifting others",
        data: image
      });
    }

    // If exists, apply proper shifting logic

    if (newPosition < oldPosition) {
      // Moving DOWN: shift positions in between UP by +1
      await carouselImage.updateMany(
        {
          position: { $gte: newPosition, $lt: oldPosition },
          _id: { $ne: carouselId }
        },
        { $inc: { position: 1 } }
      );
    }

    if (newPosition > oldPosition) {
      // Moving UP: shift positions in between DOWN by -1
      await carouselImage.updateMany(
        {
          position: { $gt: oldPosition, $lte: newPosition },
          _id: { $ne: carouselId }
        },
        { $inc: { position: -1 } }
      );
    }

    image.position = newPosition;
    await image.save();

    res.json({
      message: "Position updated successfully with shifting",
      data: image
    });

  } catch (error) {
    console.log("update error", error);
    res.status(500).json({ status: "failed", message: "Internal Server Error" });
  }
};


const deleteCarouselImage = async (req, res) => {
  try {
    const { carouselId } = req.params;
    const image = await carouselImage.findByIdAndDelete(carouselId);
    res.status(200).json({ status: 'success', message: "Carousel Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: 'failed', message: "Internal server error", error });
  }
}


// controllers/carouselController.js

const updateRedirectType = async (req, res) => {
  try {
    const { id } = req.params;
    const { redirectType } = req.body;

    if (!redirectType) {
      return res.status(400).json({
        status: "error",
        message: "Redirect type is required",
      });
    }

    const updated = await carouselImage.findByIdAndUpdate(
      id,
      { redirectType },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: "error",
        message: "Carousel not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Redirect type updated",
      data: updated,
    });

  } catch (error) {
    console.error("Update Redirect Type Error:", error);

    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};


const updateRedirectValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { redirectValue } = req.body;

    if (!redirectValue) {
      return res.status(400).json({
        status: "error",
        message: "Redirect value is required",
      });
    }

    const updated = await carouselImage.findByIdAndUpdate(
      id,
      { redirectValue },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: "error",
        message: "Carousel not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Redirect value updated",
      data: updated,
    });

  } catch (error) {
    console.error("Update Redirect Value Error:", error);

    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

module.exports = { getCarousel, addCarouselImage, updateImageStatus, updatePosition, deleteCarouselImage, updateRedirectType, updateRedirectValue };