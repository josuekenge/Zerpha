import assert from 'node:assert/strict';
import test from 'node:test';

import { canLeaveWorkspace, canRemoveWorkspaceMember } from '../services/workspaceRbac.js';

test('canRemoveWorkspaceMember', () => {
  // owner
  assert.equal(canRemoveWorkspaceMember('owner', 'admin'), true);
  assert.equal(canRemoveWorkspaceMember('owner', 'member'), true);
  assert.equal(canRemoveWorkspaceMember('owner', 'viewer'), true);
  assert.equal(canRemoveWorkspaceMember('owner', 'owner'), false);

  // admin
  assert.equal(canRemoveWorkspaceMember('admin', 'member'), true);
  assert.equal(canRemoveWorkspaceMember('admin', 'viewer'), true);
  assert.equal(canRemoveWorkspaceMember('admin', 'admin'), false);
  assert.equal(canRemoveWorkspaceMember('admin', 'owner'), false);

  // member/viewer
  assert.equal(canRemoveWorkspaceMember('member', 'viewer'), false);
  assert.equal(canRemoveWorkspaceMember('viewer', 'member'), false);
});

test('canLeaveWorkspace', () => {
  assert.equal(canLeaveWorkspace('member', 1), true);
  assert.equal(canLeaveWorkspace('viewer', 1), true);
  assert.equal(canLeaveWorkspace('admin', 1), true);

  assert.equal(canLeaveWorkspace('owner', 1), false);
  assert.equal(canLeaveWorkspace('owner', 2), true);
});


