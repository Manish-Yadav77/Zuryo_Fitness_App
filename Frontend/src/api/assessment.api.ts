import { api } from './client';
import type { AssessmentResponse, FitnessAssessment, SaveAssessmentPayload } from '@/types/assessment';

export const assessmentApi = {
  async getMine(): Promise<AssessmentResponse> {
    const { data } = await api.get<AssessmentResponse>('/assessments/me');
    return data;
  },
  async submit(payload: SaveAssessmentPayload): Promise<{ assessment: FitnessAssessment }> {
    const { data } = await api.post<{ assessment: FitnessAssessment }>('/assessments', payload);
    return data;
  },
};