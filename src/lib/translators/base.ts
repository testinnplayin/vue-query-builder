/**
 * This module defines the base machinery for translators.
 *
 * It exposes the `BaseTranslator` class that should be used by all concrete
 * translator classes.
 *
 * A translator provides a transformation for each available pipeline steps. It
 * has to be named exactly as the pipeline step name it ought to transform. A
 * transformation method must return something that matches the
 * `lib/matchers/OutputStep` type or an array of this type.
 *
 */
import { StepMatcher, OutputStep } from '@/lib/matcher';
import * as S from '@/lib/steps';

/**
 * Custom exception raised when a transform method is called on a step
 * that is not supported by the translator.
 */
export class StepNotSupported extends Error {
  constructor(public stepname: S.PipelineStepName) {
    super(`Unsupported step <${stepname}>`);
  }
}

/**
 * Method descriptor that:
 * - makes the method raises a StepNotSupported exception
 * - adds a `__vqb_step_supported__` property on the method and sets it to false
 *
 * @param target the translator instance
 * @param propertyKey the name of the method, in our case necessarily a step name
 * @param descriptor the method descriptor
 */
function unsupported(target: BaseTranslator, propertyKey: S.PipelineStepName, descriptor: any) {
  descriptor.value = function(step: S.PipelineStep) {
    throw new StepNotSupported(step.name);
  };
  descriptor.value.__vqb_step_supported__ = false;
}

/**
 * The `BaseTranslator` is the base class for all translators. It provides:
 *
 * - a default implementation for all pipeline steps that raises a
 *   `StepNotSupported` error.
 *
 * - a `translate` entry point method that takes an array of `PipelineStep`
 *   instances and return an array of objects matching the
 *   `lib/matchers/OutputStep` type.
 *
 * - two properties `supportedSteps` and `unsupportedSteps` that respectively
 *   return the list of supported and unssupported steps by the translator
 *   class. These lists are computed automatically by instrospecting the
 *   instance and testing, for each transformation step, if the corresponding
 *   method holds a `__vqb_step_supported__` property. If this value is found
 *   and set to `false`, then the step is considered as not supported.
 *
 * - a `supports` method that tests the support of a given step name.
 */
export class BaseTranslator implements StepMatcher<OutputStep> {
  /**
   * `supportedSteps` returns the list of steps supported by this translator class.
   */
  get supportedSteps(): Array<S.PipelineStepName> {
    return transformerSteps()
      .filter(stepname => this.constructor.prototype[stepname].__vqb_step_supported__ !== false)
      .sort();
  }

  /**
   * `unsupportedSteps` returns the list of steps _not_ supported by this translator class.
   */
  get unsupportedSteps(): Array<S.PipelineStepName> {
    return transformerSteps()
      .filter(stepname => this.constructor.prototype[stepname].__vqb_step_supported__ === false)
      .sort();
  }

  /**
   * `supports` returns a boolean indicating if the given step is supported or not.
   *
   * @param stepname the name of the step to test
   */
  supports(stepname: S.PipelineStepName) {
    return !this.unsupportedSteps.includes(stepname);
  }

  @unsupported
  filter(step: S.FilterStep) {}

  @unsupported
  domain(step: S.DomainStep) {}

  @unsupported
  select(step: S.SelectStep) {}

  @unsupported
  rename(step: S.RenameStep) {}

  @unsupported
  newcolumn(step: S.NewColumnStep) {}

  @unsupported
  delete(step: S.DeleteStep) {}

  @unsupported
  aggregate(step: S.AggregationStep) {}

  @unsupported
  custom(step: S.CustomStep) {}

  /**
   * translates an input pipeline into a list of steps that makes sense for the
   * targeted backend.
   *
   * @param pipeline the array of input steps.
   * @returns the list of translated output steps.
   */
  translate(pipeline: Array<S.PipelineStep>): Array<OutputStep> {
    const result: Array<OutputStep> = [];
    for (const step of pipeline) {
      switch (step.name) {
        case 'domain':
          result.push(this.domain(step));
          break;
        case 'filter':
          result.push(this.filter(step));
          break;
        case 'select':
          result.push(this.select(step));
          break;
        case 'rename':
          result.push(this.rename(step));
          break;
        case 'delete':
          result.push(this.delete(step));
          break;
        case 'newcolumn':
          result.push(this.newcolumn(step));
          break;
        case 'aggregate':
          result.push(this.aggregate(step));
          break;
        case 'custom':
          result.push(this.custom(step));
          break;
        default:
          throw new Error(step);
      }
    }
    return result;
  }
}

/**
 * TypeGuard for pipeline step names.
 *
 * If the property exists in `BaseTranslator` prototype and if it's not
 * one its known extra property, then it's a PipelineStepName.
 *
 * @param propname the property name being tested
 */
function isStepFunction(propname: string): propname is S.PipelineStepName {
  const ignoredProps = new Set([
    'constructor',
    'supportedSteps',
    'unsupportedSteps',
    'supports',
    'translate',
  ]);
  const expectedProps = new Set(Object.getOwnPropertyNames(BaseTranslator.prototype));
  return expectedProps.has(propname) && !ignoredProps.has(propname);
}

/**
 * helper to iterate on all available step names.
 */
function transformerSteps() {
  const stepnames: Array<S.PipelineStepName> = [];
  for (const propname of Object.getOwnPropertyNames(BaseTranslator.prototype)) {
    if (isStepFunction(propname)) {
      stepnames.push(propname);
    }
  }
  return stepnames;
}

/**
 * list of all available step names
 */
export const ALL_STEP_NAMES = transformerSteps().sort();