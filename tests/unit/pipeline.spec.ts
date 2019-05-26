import { expect } from 'chai';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { Pipeline } from '@/lib/steps';
import { setupStore } from '@/store';
import PipelineComponent from '@/components/Pipeline.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: ['death'] },
    ];
    const store = setupStore({ pipeline });
    const wrapper = shallowMount(PipelineComponent, { store, localVue });
    const steps = wrapper.findAll('step-stub');
    // first step is the domain step and is processed separately by the
    // Pipeline component. There should only be the 2 generated <Step>
    // components.
    expect(steps.length).to.equal(2);
    const [step1, step2] = steps.wrappers.map(stub => stub.props());
    expect(step1).to.eql({
      step: pipeline[1],
      isActive: true,
      isDisabled: false,
      isFirst: true,
      isLast: false,
      indexInPipeline: 1,
    });
    expect(step2).to.eql({
      step: pipeline[2],
      isActive: true,
      isDisabled: false,
      isFirst: false,
      isLast: true,
      indexInPipeline: 2,
    });
  });
});
