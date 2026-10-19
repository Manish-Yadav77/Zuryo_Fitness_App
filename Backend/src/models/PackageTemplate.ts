import { Schema, model } from 'mongoose';

export interface IPackageTemplate {
  name: string;
  sessions: number;
  pricePaise: number;
  validityDays: number;
  description: string;
  isActive: boolean;
}

const packageTemplateSchema = new Schema<IPackageTemplate>(
  {
    name: { type: String, required: true, trim: true },
    sessions: { type: Number, required: true, min: 1 },
    pricePaise: { type: Number, required: true, min: 0 },
    validityDays: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PackageTemplate = model<IPackageTemplate>('PackageTemplate', packageTemplateSchema);