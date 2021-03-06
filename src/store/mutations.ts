/**
 * exports the list of store mutations.
 */

import { DomainStep } from '@/lib/steps';
import { VQBState } from './state';

// provide types for each possible mutations' payloads
type DatasetMutation = {
  type: 'setDataset';
  payload: Pick<VQBState, 'dataset'>;
};

type DeleteStepMutation = {
  type: 'deleteStep';
  payload: { index: number };
};

type DomainsMutation = {
  type: 'setDomains';
  payload: Pick<VQBState, 'domains'>;
};

type PipelineMutation = {
  type: 'setPipeline';
  payload: Pick<VQBState, 'pipeline'>;
};

type SelectDomainMutation = {
  type: 'setCurrentDomain';
  payload: Pick<VQBState, 'currentDomain'>;
};

type SelectedStepMutation = {
  type: 'selectStep';
  payload: { index: number };
};

export type StateMutation =
  | DatasetMutation
  | DeleteStepMutation
  | DomainsMutation
  | PipelineMutation
  | SelectDomainMutation
  | SelectedStepMutation;

type MutationByType<M, MT> = M extends { type: MT } ? M : never;
export type MutationCallbacks = {
  [K in StateMutation['type']]: (payload: MutationByType<StateMutation, K>['payload']) => void
};

export default {
  /**
   * set currently last selected step index.
   */
  selectStep(state: VQBState, { index }: { index: number }) {
    state.selectedStepIndex = index;
  },
  /**
   * Delete the step of index `index` in pipeline.
   */
  deleteStep(state: VQBState, { index }: { index: number }) {
    state.pipeline.splice(index, 1);
  },
  /**
   * change current selected domain and reset pipeline accordingly.
   */
  setCurrentDomain(state: VQBState, { currentDomain }: Pick<VQBState, 'currentDomain'>) {
    state.currentDomain = currentDomain;
    if (currentDomain) {
      const pipeline = state.pipeline;
      const domainStep: DomainStep = { name: 'domain', domain: currentDomain };
      if (pipeline.length) {
        state.pipeline = [domainStep, ...pipeline.slice(1)];
      } else {
        state.pipeline = [domainStep];
      }
    }
  },
  /**
   * set the list of available domains.
   */
  setDomains(state: VQBState, { domains }: Pick<VQBState, 'domains'>) {
    state.domains = domains;
    state.currentDomain = domains.length ? domains[0] : undefined;
  },
  /**
   * update pipeline.
   */
  setPipeline(state: VQBState, { pipeline }: Pick<VQBState, 'pipeline'>) {
    state.pipeline = pipeline;
  },
  /**
   * update dataset.
   */
  setDataset(state: VQBState, { dataset }: Pick<VQBState, 'dataset'>) {
    state.dataset = dataset;
  },

  /**
   * toggle column selection
   */
  toggleColumnSelection(state: VQBState, column: string) {
    state.selectedColumns = [column];
  },
};
