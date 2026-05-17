import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Camera, CameraDocument } from './schemas/camera.schema';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

@Injectable()
export class CamerasService {
  constructor(
    @InjectModel(Camera.name) private cameraModel: Model<CameraDocument>,
  ) {}

  /**
   * Create a new camera document.
   * The sourceUrl (video filename) must be unique.
   */
  async create(dto: CreateCameraDto): Promise<Camera> {
    const existing = await this.cameraModel
      .findOne({ sourceUrl: dto.sourceUrl })
      .exec();

    if (existing) {
      throw new ConflictException(
        `A camera with sourceUrl "${dto.sourceUrl}" already exists.`,
      );
    }

    const camera = new this.cameraModel(dto);
    return camera.save();
  }

  /**
   * Return all cameras.
   * The Python worker calls GET /cameras on startup to get active cameras.
   */
  async findAll(): Promise<Camera[]> {
    return this.cameraModel.find().exec();
  }

  /**
   * Return only cameras with isActive = true.
   * Convenience method used by the Python worker fetch.
   */
  async findActive(): Promise<Camera[]> {
    return this.cameraModel.find({ isActive: true }).exec();
  }

  /**
   * Return a single camera by its MongoDB _id string.
   */
  async findById(id: string): Promise<Camera> {
    const camera = await this.cameraModel.findById(id).exec();

    if (!camera) {
      throw new NotFoundException(`Camera with ID "${id}" not found.`);
    }

    return camera;
  }

  /**
   * Update camera fields (PATCH — only provided fields are changed).
   */
  async update(id: string, dto: UpdateCameraDto): Promise<Camera> {
    const camera = await this.cameraModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .exec();

    if (!camera) {
      throw new NotFoundException(`Camera with ID "${id}" not found.`);
    }

    return camera;
  }

  /**
   * Delete a camera document.
   */
  async remove(id: string): Promise<void> {
    const result = await this.cameraModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Camera with ID "${id}" not found.`);
    }
  }

  /**
   * Update the latestDetection field on a camera document.
   *
   * Called by DetectionsService every time the Python worker posts a new frame result.
   * This overwrites the previous latestDetection — we do NOT keep a history here.
   * If you need history, that goes in a separate detections collection (future feature).
   */
  async updateLatestDetection(
    cameraId: string,
    latestDetection: {
      timestamp: string;
      snapshotUrl: string;
      detections: Array<{ class: string; confidence: number; bbox: number[] }>;
      riskLevel: string;
      videoTimestampMs: number;
    },
  ): Promise<Camera> {
    const camera = await this.cameraModel
      .findByIdAndUpdate(
        cameraId,
        { latestDetection, status: 'active' },
        { returnDocument: 'after' },
      )
      .exec();

    if (!camera) {
      throw new NotFoundException(`Camera with ID "${cameraId}" not found.`);
    }

    return camera;
  }

  /**
   * Set the runtime status of a camera (active / inactive / error).
   * Called by the Python worker when it starts or stops processing.
   */
  async updateStatus(
    cameraId: string,
    status: 'active' | 'inactive' | 'error',
  ): Promise<Camera> {
    const camera = await this.cameraModel
      .findByIdAndUpdate(cameraId, { status }, { returnDocument: 'after' })
      .exec();

    if (!camera) {
      throw new NotFoundException(`Camera with ID "${cameraId}" not found.`);
    }

    return camera;
  }
}
