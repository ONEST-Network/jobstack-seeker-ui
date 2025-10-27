import { JobItem } from '@/hooks/useJobSearch';

/**
 * Calculate total openings from an array of jobs
 * Sums up openings or positions for each job, defaulting to 1 if not specified
 * 
 * @param jobs - Array of JobItem objects
 * @returns Total number of openings across all jobs
 */
export function calculateTotalOpenings(jobs: JobItem[]): number {
  return jobs.reduce((sum, job) => {
    const openings = job.openings || job.positions || 1;
    return sum + openings;
  }, 0);
}

