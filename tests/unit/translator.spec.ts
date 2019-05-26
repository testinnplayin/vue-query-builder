import { expect } from 'chai';
import * as S from '@/lib/steps';
import {
  availableTranslators,
  backendsSupporting,
  registerTranslator,
  getTranslator,
} from '@/lib/translators';
import { BaseTranslator, ALL_STEP_NAMES } from '@/lib/translators/base';

class DummyStringTranslator extends BaseTranslator {
  /* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
  domain(step: S.DomainStep) {
    return 'domain';
  }
  filter(step: S.FilterStep) {
    return 'filter';
  }
  rename(step: S.RenameStep) {
    return 'rename';
  }
  /* eslint-enable no-unused-vars, @typescript-eslint/no-unused-vars */
}

describe('base translator class', () => {
  class NoSupportTranslator extends BaseTranslator {}

  it('should be able to get list of supported operations', () => {
    const notrs = new NoSupportTranslator();
    const dummytrs = new DummyStringTranslator();

    expect(notrs.unsupportedSteps).to.eql(ALL_STEP_NAMES);
    expect(notrs.supportedSteps).to.eql([]);
    expect(dummytrs.supportedSteps).to.eql(['domain', 'filter', 'rename']);
    expect(dummytrs.supports('domain')).to.be.true;
    expect(dummytrs.supports('filter')).to.be.true;
    expect(dummytrs.supports('rename')).to.be.true;
    expect(dummytrs.supports('aggregate')).to.be.false;
  });

  it('should raise a NotSupported error', () => {
    const notrs = new NoSupportTranslator();
    expect(() => notrs.translate([{ name: 'domain', domain: 'my-domain' }])).to.throw(
      'Unsupported step <domain>',
    );
  });

  it('should raise a NotSupported error', () => {
    const dummytrs = new DummyStringTranslator();
    expect(() =>
      dummytrs.translate([
        { name: 'domain', domain: 'my-domain' },
        { name: 'rename', oldname: 'old', newname: 'new' },
        { name: 'delete', columns: ['col1'] },
        { name: 'rename', oldname: 'old2', newname: 'new2' },
      ]),
    ).to.throw('Unsupported step <delete>');
  });

  it('should be possible to call translate on a translator', () => {
    const dummytrs = new DummyStringTranslator();
    expect(
      dummytrs.translate([
        { name: 'domain', domain: 'my-domain' },
        { name: 'rename', oldname: 'old', newname: 'new' },
        { name: 'rename', oldname: 'old2', newname: 'new2' },
      ]),
    ).to.eql(['domain', 'rename', 'rename']);
  });
});

describe('translator registration', () => {
  it('should be possible to register backends', () => {
    registerTranslator('dummy', DummyStringTranslator);
    expect(backendsSupporting('aggregate')).to.eql(['mongo36']);
    expect(backendsSupporting('domain')).to.eql(['dummy', 'mongo36']);
  });

  it('should throw an error if backend is not available', () => {
    expect(() => getTranslator('bla')).to.throw();
  });

  it('should be possible to get all available translators', () => {
    registerTranslator('dummy', DummyStringTranslator);
    const translators = availableTranslators();
    expect(Object.keys(translators).sort()).to.eql(['dummy', 'mongo36']);
  });
});
