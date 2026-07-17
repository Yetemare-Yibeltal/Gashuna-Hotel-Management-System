import { Router } from 'express';
import {
  uploadRoomImages,
  uploadRoomSingleImage,
  deleteRoomImage,
  uploadStaffPhoto,
  uploadMenuItemPhoto,
  uploadGalleryImage,
  getUploadedFiles,
  deleteUploadedFile,
} from '../controllers/uploadController';
import { protect, authorize } from '../middleware/authMiddleware';
import {
  uploadRoomImage,
  uploadMultipleRoomImages,
  uploadStaffPhoto as uploadStaffPhotoMiddleware,
  uploadMenuPhoto,
  uploadGalleryPhoto,
} from '../middleware/uploadMiddleware';

const router = Router();

router.use(protect);

router.get(
  '/',
  authorize('admin', 'manager'),
  getUploadedFiles
);

router.post(
  '/rooms/:id/images',
  authorize('admin', 'manager'),
  uploadMultipleRoomImages.array('images', 10),
  uploadRoomImages
);

router.post(
  '/rooms/:id/image',
  authorize('admin', 'manager'),
  uploadRoomImage.single('image'),
  uploadRoomSingleImage
);

router.delete(
  '/rooms/:id/image',
  authorize('admin', 'manager'),
  deleteRoomImage
);

router.post(
  '/staff/:id/photo',
  authorize('admin', 'manager'),
  uploadStaffPhotoMiddleware.single('photo'),
  uploadStaffPhoto
);

router.post(
  '/menu/:id/photo',
  authorize('admin', 'manager'),
  uploadMenuPhoto.single('photo'),
  uploadMenuItemPhoto
);

router.post(
  '/gallery',
  authorize('admin', 'manager'),
  uploadGalleryPhoto.single('image'),
  uploadGalleryImage
);

router.delete(
  '/file',
  authorize('admin'),
  deleteUploadedFile
);

export default router;
