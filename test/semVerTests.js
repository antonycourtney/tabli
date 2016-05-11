
import test from 'tape';
import * as semver from 'semver';

test('basic semver test', (t) => {
  const verStr0 = '0.8.0';
  const verStr1 = '0.9.0-beta';
  const verStr2 = '0.9.0';
  const verStr3 = '0.9.1';

  t.ok(semver.valid('0.8.0'), 'semver.valid on expected good version number');
  t.notOk(semver.valid(''), 'semver.valid on empty string');
  t.notOk(semver.gt(verStr0,verStr0), '(vs > vs) === false');
  t.ok(semver.gt(verStr1,verStr0),'v1 > v0');
  t.notOk(semver.gt(verStr0,verStr1),'!(v0 > v1)');

  t.ok(semver.gt(verStr2,verStr1), verStr2 + " > " + verStr1 );
  t.end();
});