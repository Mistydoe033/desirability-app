import { ACTIVITIES } from '../../constants/constants';
import { ActivityName, ActivityScorer } from '../../types/types';
import { indoorScorer } from './indoorScorer';
import { outdoorSightseeingScorer } from './outdoorSightseeingScorer';
import { skiingScorer } from './skiingScorer';
import { surfingScorer } from './surfingScorer';

const scorerMap: Record<ActivityName, ActivityScorer> = {
  Skiing: skiingScorer,
  Surfing: surfingScorer,
  'Outdoor sightseeing': outdoorSightseeingScorer,
  'Indoor sightseeing': indoorScorer
};

class ScoringFactory {
  listActivities(): ActivityName[] {
    return [...ACTIVITIES];
  }

  getScorer(activity: ActivityName): ActivityScorer {
    return scorerMap[activity];
  }

  isSupportedActivity(activity: string): activity is ActivityName {
    return Object.prototype.hasOwnProperty.call(scorerMap, activity);
  }
}

export const scoringFactory = new ScoringFactory();
