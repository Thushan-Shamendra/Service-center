import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { createFinalInspectionReport } from '../controllers/finalInspectionReportController.js';
import FinalInspectionReport from '../models/FinalInspectionReport.js';
import JobCard from '../models/JobCard.js';
import Employee from '../models/Employee.js';

const jobId = new mongoose.Types.ObjectId();
const employeeId = new mongoose.Types.ObjectId();
const userId = new mongoose.Types.ObjectId();

// Support both direct awaits and the query helpers used for populated records.
const queryResult = value => {
  const query = {
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
    select: () => query,
    populate: () => query,
    sort: () => query,
    lean: () => query,
  };
  return query;
};

const makeBody = overrides => ({
  jobCard: jobId.toString(),
  status: 'submitted',
  workPerformed: ['Replaced engine oil and filters'],
  partsReplaced: [
    { name: 'Engine oil', quantity: 1, unitPrice: 6000, total: 6000 },
    { name: 'Oil filter', quantity: 1, unitPrice: 1500, total: 1500 },
    { name: 'Air filter', quantity: 2, unitPrice: 2000, total: 4000 },
    { name: 'Drain plug', quantity: 1, unitPrice: 1500, total: 1500 },
  ],
  safetyCheck: { overallStatus: 'pass', checkedItems: ['brakes', 'fluids'] },
  roadTestResult: { result: 'pass', remarks: 'No faults found' },
  finalCondition: 'good',
  mechanicRemarks: 'All requested service work completed and checked.',
  evidence: [{ type: 'after', url: '/uploads/final-inspections/test.jpg', caption: 'After service' }],
  reportSummary: { totalPartsCost: 13000, laborCost: 1000, totalCost: 14000, totalHours: 6.01 },
  ...overrides,
});

const makeContext = t => {
  const state = { inserted: [], jobUpdates: [] };
  const employee = { _id: employeeId, user: userId };
  const jobCard = { _id: jobId, assignedTechnician: employeeId, status: 'work_complete' };
  t.mock.method(JobCard, 'findById', () => queryResult(jobCard));
  t.mock.method(Employee, 'findOne', () => queryResult(employee));
  t.mock.method(Employee, 'findById', () => queryResult(employee));
  t.mock.method(FinalInspectionReport, 'findOne', () => queryResult(null));
  t.mock.method(FinalInspectionReport, 'countDocuments', () => queryResult(0));
  t.mock.method(JobCard, 'findByIdAndUpdate', (id, update) => {
    state.jobUpdates.push({ id, update });
    return queryResult({ ...jobCard, ...update });
  });
  // Keep real Mongoose validation and save hooks, while preventing any DB write.
  t.mock.method(FinalInspectionReport.collection, 'insertOne', async document => {
    state.inserted.push(document);
    return { acknowledged: true, insertedId: document._id };
  });
  t.mock.method(console, 'error', () => {});
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const invoke = async body => {
    await createFinalInspectionReport({
      body,
      user: { id: userId.toString(), _id: userId, role: 'employee' },
    }, response);
    return response;
  };
  return { state, invoke };
};

test('rejects missing mechanic remarks with a field validation response', async t => {
  const { state, invoke } = makeContext(t);
  const response = await invoke(makeBody({ mechanicRemarks: '' }));
  assert.equal(response.statusCode, 400);
  assert.match(JSON.stringify(response.body), /mechanic\s*remarks/i);
  assert.equal(state.inserted.length, 0);
  assert.equal(state.jobUpdates.length, 0);
});

test('rejects mechanic remarks longer than 500 characters before writing', async t => {
  const { state, invoke } = makeContext(t);
  const response = await invoke(makeBody({ mechanicRemarks: 'a'.repeat(501) }));
  assert.equal(response.statusCode, 400);
  assert.match(JSON.stringify(response.body), /mechanic\s*remarks/i);
  assert.equal(state.inserted.length, 0);
  assert.equal(state.jobUpdates.length, 0);
});

test('submits a report with job-card parts, decimal hours, and evidence intact', async t => {
  const { state, invoke } = makeContext(t);
  const response = await invoke(makeBody());
  assert.equal(response.statusCode, 201, JSON.stringify(response.body));
  assert.equal(response.body.success, true);
  assert.equal(state.inserted.length, 1);
  const saved = state.inserted[0];
  assert.equal(saved.status, 'submitted');
  assert.equal(saved.technician.toString(), employeeId.toString());
  assert.equal(saved.partsReplaced[0].itemName, 'Engine oil');
  assert.equal(saved.partsReplaced[2].quantity, 2);
  assert.equal(saved.partsReplaced[2].cost, 4000);
  assert.equal(saved.totalPartsCost, 13000);
  assert.equal(saved.laborCost, 1000);
  assert.equal(saved.totalCost, 14000);
  assert.equal(saved.reportSummary.totalHours, 6.01);
  assert.equal(saved.timeSummary.totalHours, 6.01);
  assert.equal(saved.evidence[0].url, '/uploads/final-inspections/test.jpg');
  assert.equal(saved.evidence[0].type, 'after');
  assert.equal(state.jobUpdates.length, 1);
  assert.equal(state.jobUpdates[0].id.toString(), jobId.toString());
  assert.equal(state.jobUpdates[0].update.status ?? state.jobUpdates[0].update.$set?.status, 'ready_for_delivery');
});

test('returns a useful 400 response for schema validation errors', async t => {
  const { state, invoke } = makeContext(t);
  const error = new mongoose.Error.ValidationError();
  error.addError('finalCondition', new mongoose.Error.ValidatorError({
    path: 'finalCondition',
    message: 'Select a valid final vehicle condition',
  }));
  t.mock.method(FinalInspectionReport, 'create', async () => { throw error; });
  const response = await invoke(makeBody());
  assert.equal(response.statusCode, 400);
  assert.match(JSON.stringify(response.body), /finalCondition|final vehicle condition/i);
  assert.equal(state.inserted.length, 0);
  assert.equal(state.jobUpdates.length, 0);
});
