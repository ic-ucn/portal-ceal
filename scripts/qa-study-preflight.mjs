import assert from 'node:assert/strict';
import { checkStudyConfiguration } from './study-preflight.mjs';

const env = {
  PORTAL_GOOGLE_CLIENT_ID: 'qa-client', STUDY_CALENDAR_CLIENT_SECRET: 'qa-secret-only',
  PORTAL_TOKEN_ENCRYPTION_KEY: 'qa-encryption-key-'.repeat(3),
  STUDY_CALENDAR_REDIRECT_URI: 'https://api.example.test/api/study/calendar/callback',
  STUDY_PORTAL_RETURN_URL: 'https://portal.example.test/',
  SUPABASE_URL: 'https://state.example.test', SUPABASE_SECRET_KEY: 'qa-state-secret'
};
assert.equal(checkStudyConfiguration({}).configurationComplete, false);
assert.equal(checkStudyConfiguration(env, true).configurationComplete, true);
assert.equal(checkStudyConfiguration({ ...env, QA_TEST_MODE: '1' }, true).configurationComplete, false);
assert.equal(checkStudyConfiguration({ ...env, PORTAL_TOKEN_ENCRYPTION_KEY: 'short' }).configurationComplete, false);
assert.equal(checkStudyConfiguration({ ...env, STUDY_CALENDAR_CLIENT_SECRET: '<secret>' }).configurationComplete, false);
assert.equal(checkStudyConfiguration({ ...env, STUDY_PORTAL_RETURN_URL: 'https://user:pass@portal.example.test/' }).configurationComplete, false);
assert.equal(checkStudyConfiguration({ ...env, STUDY_CALENDAR_REDIRECT_URI: 'https://api.example.test/wrong' }).configurationComplete, false);
const internal = { ...env, STUDY_PORTAL_RETURN_URL: 'http://127.0.0.1:8105/' };
assert.equal(checkStudyConfiguration(internal).configurationComplete, true);
assert.equal(checkStudyConfiguration(internal, true).configurationComplete, false);
assert.equal(checkStudyConfiguration({ ...env, PORTAL_STATE_BACKEND: 'local' }, true).configurationComplete, false);
const report = JSON.stringify(checkStudyConfiguration(env, true));
for (const value of Object.values(env)) assert.ok(!report.includes(value), 'Report must not contain environment values');
console.log('Study preflight: missing configuration, release restrictions, unsafe returns and credential redaction passed.');
