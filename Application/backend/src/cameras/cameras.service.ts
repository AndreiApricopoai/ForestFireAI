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

  async findAll(): Promise<Camera[]> {
    return this.cameraModel.find().exec();
  }

  async findActive(): Promise<Camera[]> {
    return this.cameraModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<Camera> {
    const camera = await this.cameraModel.findById(id).exec();

    if (!camera) {
      throw new NotFoundException(`Camera with ID "${id}" not found.`);
    }

    return camera;
  }

  async update(id: string, dto: UpdateCameraDto): Promise<Camera> {
    const camera = await this.cameraModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .exec();

    if (!camera) {
      throw new NotFoundException(`Camera with ID "${id}" not found.`);
    }

    return camera;
  }

  async remove(id: string): Promise<void> {
    const result = await this.cameraModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Camera with ID "${id}" not found.`);
    }
  }

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
